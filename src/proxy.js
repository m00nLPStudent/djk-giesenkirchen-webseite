import { NextResponse } from "next/server";
import { AUTH_REQUIRED_FOR_ADMIN } from "./lib/admin-auth/adminAuthConfig";
import { AUTH_ENFORCEMENT_ENABLED } from "./lib/admin-auth/adminPermissionConfig";
import {
  buildLoginRedirectTarget,
  normalizeAdminRedirectPath,
} from "./lib/admin-auth/adminAuthRedirects";
import { resolveAdminProfileForAuthUser } from "./lib/admin-auth/adminProfileLookup";
import { hasPermission } from "./lib/admin-auth/permissionEngine";
import {
  expireSupabaseAuthCookies,
  getSupabaseAuthCookieNames,
  isInvalidRefreshTokenError,
} from "./lib/supabase.auth";
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

function redirectToLogin(request, { reason = null } = {}) {
  const redirectTarget = buildLoginRedirectTarget(
    normalizeAdminRedirectPath(
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    ),
  );

  return NextResponse.redirect(
    buildRedirectUrl(request, "/admin/login", {
      reason,
      redirect: redirectTarget || "/admin",
    }),
  );
}

function clearSupabaseAuthCookies(request, response) {
  const cookieNames = getSupabaseAuthCookieNames(
    request.cookies.getAll(),
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );

  cookieNames.forEach((cookieName) => {
    try {
      request.cookies.delete(cookieName);
    } catch {
      // Ignore request-cookie mutation errors in runtimes where it is read-only.
    }
  });

  expireSupabaseAuthCookies(cookieNames, (name, value, options) => {
    response.cookies.set(name, value, options);
  });

  return cookieNames;
}

function redirectToExpiredSessionLogin(request) {
  const response = redirectToLogin(request, {
    reason: "session-expired",
  });
  const clearedCookieNames = clearSupabaseAuthCookies(request, response);
  return { response, clearedCookieNames };
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

  const proxyClient = createSupabaseProxyClient(request);
  const requestCookieNames = getSupabaseAuthCookieNames(
    request.cookies.getAll(),
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );

  if (process.env.NODE_ENV === "development") {
    console.info("[admin-proxy:cookies:request]", {
      pathname,
      hasAuthCookies: requestCookieNames.length > 0,
      authCookieNames: requestCookieNames,
    });
  }

  if (!proxyClient) {
    return redirectToLogin(request);
  }

  const { supabase, getResponse, didSyncCookies } = proxyClient;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (process.env.NODE_ENV === "development") {
    const responseCookieNames = getSupabaseAuthCookieNames(
      getResponse().cookies.getAll(),
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    );

    console.info("[admin-proxy]", {
      pathname,
      hasUser: Boolean(user?.id),
      hasError: Boolean(userError),
      hasAuthCookiesInRequest: requestCookieNames.length > 0,
      responseHasAuthCookies: responseCookieNames.length > 0,
      responseAuthCookieNames: responseCookieNames,
      userErrorCode: userError?.code || null,
      userErrorStatus: userError?.status || null,
      userErrorMessage: userError?.message || null,
      cookieSyncTriggered: didSyncCookies(),
    });
  }

  if (isInvalidRefreshTokenError(userError)) {
    const { response, clearedCookieNames } =
      redirectToExpiredSessionLogin(request);

    if (process.env.NODE_ENV === "development") {
      console.info("[admin-proxy] invalid refresh token detected", {
        pathname,
        code: userError?.code || null,
        status: userError?.status || null,
        cookiesCleared: clearedCookieNames.length > 0,
        clearedCookieNames,
      });
    }

    return response;
  }

  if (userError || !user?.id) {
    return redirectToLogin(request);
  }

  const profileResolution = await resolveAdminProfileForAuthUser(
    supabase,
    user,
    { fields: "id, email, is_active" },
  );

  if (process.env.NODE_ENV === "development") {
    console.info("[admin-proxy:profile]", {
      pathname,
      hasAuthUser: Boolean(user?.id),
      profileFound: Boolean(profileResolution?.profile?.id),
      lookupType: profileResolution?.lookupType || null,
      fallbackUsed: Boolean(profileResolution?.fallbackUsed),
      hasQueryError: Boolean(profileResolution?.queryError),
      queryErrorCode: profileResolution?.queryError?.code || null,
      queryErrorMessage: profileResolution?.queryError?.message || null,
    });
  }

  if (profileResolution?.queryError) {
    if (process.env.NODE_ENV === "development") {
      console.error("[admin-proxy] profile lookup failed", {
        lookupType: profileResolution.lookupType || null,
        code: profileResolution.queryError.code || null,
        message: profileResolution.queryError.message || null,
      });
    }

    return redirectToLogin(request);
  }

  const profile = profileResolution?.profile || null;

  if (!profile?.id) {
    return redirectToUnauthorized(request, "missing-admin-profile");
  }

  if (profile.is_active === false) {
    return redirectToUnauthorized(request, "inactive-user");
  }

  if (!AUTH_ENFORCEMENT_ENABLED) {
    return getResponse();
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

  return getResponse();
}

export const config = {
  matcher: ["/admin/:path*"],
};
