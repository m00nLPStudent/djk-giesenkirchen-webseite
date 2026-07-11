import { NextResponse } from "next/server";
import { AUTH_REQUIRED_FOR_ADMIN } from "./lib/admin-auth/adminAuthConfig";
import { AUTH_ENFORCEMENT_ENABLED } from "./lib/admin-auth/adminPermissionConfig";
import {
  buildLoginRedirectTarget,
  normalizeAdminRedirectPath,
} from "./lib/admin-auth/adminAuthRedirects";
import { hasPermission } from "./lib/admin-auth/permissionEngine";
import { createSupabaseProxyClient } from "./lib/supabase.proxy";

const PUBLIC_ADMIN_ROUTES = new Set([
  "/admin/login",
  "/admin/forgot-password",
  "/admin/set-password",
  "/admin/unauthorized",
]);

function isPublicAdminRoute(pathname = "") {
  return PUBLIC_ADMIN_ROUTES.has(pathname);
}

function buildRedirectUrl(request, pathname, searchParams = null) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";

  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });
  }

  return url;
}

function redirectToLogin(request) {
  const redirectTarget = buildLoginRedirectTarget(
    normalizeAdminRedirectPath(
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    ),
  );

  return NextResponse.redirect(
    buildRedirectUrl(request, "/admin/login", {
      redirect: redirectTarget || "/admin",
    }),
  );
}

function redirectToUnauthorized(request, reason, permission = null) {
  return NextResponse.redirect(
    buildRedirectUrl(request, "/admin/unauthorized", {
      reason,
      permission,
    }),
  );
}

async function loadProxyPermissionContext(
  supabase,
  user,
  profile,
  { includePermissions = false } = {},
) {
  const { data: roleLinks, error: roleLinksError } = await supabase
    .from("admin_user_roles")
    .select("role_id, is_primary")
    .eq("user_id", profile.id || user.id);

  if (roleLinksError) {
    return { ok: false };
  }

  const roleIds = Array.from(
    new Set((roleLinks || []).map((row) => row?.role_id).filter(Boolean)),
  );

  if (!roleIds.length) {
    return {
      ok: true,
      userContext: {
        userId: user.id,
        hasAdminProfile: true,
        isActive: profile?.is_active !== false,
        roles: [],
        permissions: [],
        isSuperAdmin: false,
      },
    };
  }

  const { data: roles, error: rolesError } = await supabase
    .from("admin_roles")
    .select("id, key")
    .in("id", roleIds);

  if (rolesError) {
    return { ok: false };
  }

  const baseContext = {
    userId: user.id,
    hasAdminProfile: true,
    isActive: profile?.is_active !== false,
    roles: roles || [],
    permissions: [],
    isSuperAdmin: (roles || []).some((role) => role?.key === "superadmin"),
  };

  if (!includePermissions) {
    return {
      ok: true,
      userContext: baseContext,
    };
  }

  const { data: rolePermissions, error: rolePermissionsError } = await supabase
    .from("admin_role_permissions")
    .select("permission_id")
    .in("role_id", roleIds);

  if (rolePermissionsError) {
    return { ok: false };
  }

  const permissionIds = Array.from(
    new Set(
      (rolePermissions || []).map((row) => row?.permission_id).filter(Boolean),
    ),
  );

  if (!permissionIds.length) {
    return {
      ok: true,
      userContext: baseContext,
    };
  }

  const { data: permissions, error: permissionsError } = await supabase
    .from("admin_permissions")
    .select("key")
    .in("id", permissionIds);

  if (permissionsError) {
    return { ok: false };
  }

  return {
    ok: true,
    userContext: {
      ...baseContext,
      permissions: (permissions || []).map((permission) => permission?.key),
    },
  };
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (!AUTH_REQUIRED_FOR_ADMIN || isPublicAdminRoute(pathname)) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const supabase = createSupabaseProxyClient(request, response);

  if (!supabase) {
    return redirectToLogin(request);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (process.env.NODE_ENV === "development") {
    console.info("[admin-proxy]", {
      pathname,
      hasUser: Boolean(user?.id),
      hasError: Boolean(userError),
    });
  }

  if (userError || !user?.id) {
    return redirectToLogin(request);
  }

  const profileById = await supabase
    .from("admin_profiles")
    .select("id, email, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (profileById?.error) {
    return redirectToUnauthorized(request, "missing-admin-profile");
  }

  const profileByEmail =
    !profileById?.data && user?.email
      ? await supabase
          .from("admin_profiles")
          .select("id, email, is_active")
          .eq("email", user.email)
          .maybeSingle()
      : { data: null, error: null };

  if (profileByEmail?.error) {
    return redirectToUnauthorized(request, "missing-admin-profile");
  }

  const profile = profileById?.data || profileByEmail?.data || null;

  if (!profile?.id) {
    return redirectToUnauthorized(request, "missing-admin-profile");
  }

  if (profile.is_active === false) {
    return redirectToUnauthorized(request, "inactive-user");
  }

  if (!AUTH_ENFORCEMENT_ENABLED) {
    return response;
  }

  const { resolveAdminRoutePermission } =
    await import("./lib/admin-auth/adminPermissionConfig");
  const routeResolution = resolveAdminRoutePermission(pathname);
  const requiredPermission = routeResolution.permission;

  if (!requiredPermission) {
    return redirectToUnauthorized(request, "missing-permission");
  }

  const permissionContext = await loadProxyPermissionContext(
    supabase,
    user,
    profile,
    {
      includePermissions: true,
    },
  );

  if (!permissionContext.ok) {
    return redirectToUnauthorized(
      request,
      "missing-permission",
      requiredPermission,
    );
  }

  if (!hasPermission(permissionContext.userContext, requiredPermission)) {
    return redirectToUnauthorized(
      request,
      "missing-permission",
      requiredPermission,
    );
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
