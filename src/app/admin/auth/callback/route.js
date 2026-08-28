import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { buildAdminRequestRedirectUrl } from "@/lib/admin-auth/adminRequestOrigin.mjs";

const RECOVERY_COOKIE = "admin-password-recovery";

function safeNext(value) {
  return value === "/admin/set-password" ? value : "/admin/set-password";
}

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeNext(requestUrl.searchParams.get("next"));
  const invalidRedirect = buildAdminRequestRedirectUrl(request, "/admin/set-password");
  if (!invalidRedirect) {
    return new Response("Invalid request origin", { status: 400 });
  }
  if (!code) {
    const invalidUrl = new URL(invalidRedirect);
    invalidUrl.search = "?error=invalid-or-expired";
    return NextResponse.redirect(invalidUrl);
  }

  const pendingCookies = [];
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) { pendingCookies.push(...cookiesToSet); },
      },
    },
  );
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data?.session?.user?.id) {
    console.warn("[admin-auth-callback] recovery exchange failed", { code: error?.code || "RECOVERY_EXCHANGE_FAILED", status: error?.status || null });
    const invalidUrl = new URL(invalidRedirect);
    invalidUrl.search = "?error=invalid-or-expired";
    return NextResponse.redirect(invalidUrl);
  }

  const redirectUrl = buildAdminRequestRedirectUrl(request, next);
  if (!redirectUrl) {
    return new Response("Invalid request origin", { status: 400 });
  }
  const response = NextResponse.redirect(redirectUrl);
  pendingCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  response.cookies.set(RECOVERY_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: requestUrl.protocol === "https:",
    path: "/admin/set-password",
    maxAge: 10 * 60,
  });
  return response;
}
