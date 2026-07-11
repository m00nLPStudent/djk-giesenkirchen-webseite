import { NextResponse } from "next/server";
import { AUTH_REQUIRED_FOR_ADMIN } from "./lib/admin-auth/adminAuthConfig";
import {
  buildLoginRedirectTarget,
  normalizeAdminRedirectPath,
} from "./lib/admin-auth/adminAuthRedirects";
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

function redirectToUnauthorized(request, reason) {
  return NextResponse.redirect(
    buildRedirectUrl(request, "/admin/unauthorized", { reason }),
  );
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

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
