import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const RECOVERY_COOKIE = "admin-password-recovery";
const INVALID_TARGET = "/admin/set-password?error=invalid-or-expired";

function safeNext(value) {
  return value === "/admin/set-password" ? value : "/admin/set-password";
}

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeNext(requestUrl.searchParams.get("next"));
  if (!code) return NextResponse.redirect(new URL(INVALID_TARGET, requestUrl.origin));

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
    return NextResponse.redirect(new URL(INVALID_TARGET, requestUrl.origin));
  }

  const response = NextResponse.redirect(new URL(next, requestUrl.origin));
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
