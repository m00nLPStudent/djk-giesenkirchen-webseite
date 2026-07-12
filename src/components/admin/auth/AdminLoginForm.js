"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase.browser";
import { AUTH_REQUIRED_FOR_ADMIN } from "@/lib/admin-auth/adminAuthConfig";
import {
  getCurrentAdminContext,
  updateLastLoginAt,
} from "@/lib/admin-auth/adminSession.service";

function getBrowserSupabaseCookieNames() {
  if (typeof document === "undefined") return [];

  return document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.split("=")[0])
    .filter((name) => name.startsWith("sb-"));
}

function hasSupabaseAuthLocalStorageState() {
  if (typeof window === "undefined" || !window.localStorage) return false;

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index) || "";
    if (key.startsWith("sb-") && key.includes("auth-token")) {
      return true;
    }
  }

  return false;
}

export default function AdminLoginForm({
  redirectTarget = "/admin",
  hasRedirectQuery = false,
  sessionExpiredNotice = false,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkExistingSession() {
      if (!AUTH_REQUIRED_FOR_ADMIN) return;

      const context = await getCurrentAdminContext();
      if (!active) return;

      if (context?.user?.id && context?.hasAdminProfile && context?.isActive) {
        window.location.replace(redirectTarget || "/admin");
      }
    }

    checkExistingSession();

    return () => {
      active = false;
    };
  }, [redirectTarget]);

  useEffect(() => {
    async function clearExpiredLocalAuthState() {
      if (!sessionExpiredNotice) return;

      const supabaseBrowser = getSupabaseBrowserClient();
      if (!supabaseBrowser) return;

      await supabaseBrowser.auth.signOut({ scope: "local" });
    }

    clearExpiredLocalAuthState();
  }, [sessionExpiredNotice]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabaseBrowser = getSupabaseBrowserClient();
      if (!supabaseBrowser) {
        setError("Browser-Kontext fehlt. Bitte Seite neu laden.");
        return;
      }

      const { data, error: signInError } =
        await supabaseBrowser.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        console.error("[admin-login] sign-in failed", {
          code: signInError.code || null,
          message: signInError.message || null,
        });
        setError("Login fehlgeschlagen. Bitte Zugangsdaten pruefen.");
        return;
      }

      const hasSessionFromSignIn = Boolean(data?.session);
      const hasUserFromSignIn = Boolean(data?.user?.id);

      if (process.env.NODE_ENV === "development") {
        const cookieNames = getBrowserSupabaseCookieNames();
        const finalTarget = redirectTarget || "/admin";

        console.info("[admin-login:session-sync]", {
          loginSuccess: true,
          hasSessionFromSignIn,
          hasUserFromSignIn,
          hasRedirectQuery,
          normalizedRedirectTarget: redirectTarget || "/admin",
          finalTarget,
          hasAuthCookies: cookieNames.length > 0,
          authCookieNames: cookieNames,
          hasAuthStateInLocalStorage: hasSupabaseAuthLocalStorageState(),
        });
      }

      if (!hasSessionFromSignIn || !hasUserFromSignIn) {
        setError(
          "Sitzung konnte nicht stabil gespeichert werden. Bitte erneut versuchen.",
        );
        return;
      }

      const finalTarget = redirectTarget || "/admin";

      if (data?.user?.id) {
        await updateLastLoginAt(data.user.id);
      }

      if (!data?.user?.id) {
        setError("Login fehlgeschlagen. Bitte Seite neu laden.");
        return;
      }

      if (!AUTH_REQUIRED_FOR_ADMIN) {
        window.location.replace("/admin");
        return;
      }

      window.location.replace(finalTarget);
    } catch (error) {
      console.error("[admin-login] unexpected error", {
        message: error?.message || String(error),
        code: error?.code || null,
      });
      setError(
        "Login konnte nicht abgeschlossen werden. Bitte erneut versuchen.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.14),transparent_35%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_28%),#101014] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <section className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.22)] sm:p-8">
          <p className="text-[0.65rem] font-black uppercase tracking-[0.35em] text-red-400">
            Admin Login
          </p>
          <h1 className="mt-3 text-3xl font-black">Anmeldung</h1>
          <p className="mt-3 text-sm leading-7 text-white/60">
            Zugriff ist nur fuer freigegebene Admin-Benutzer vorgesehen.
          </p>

          {sessionExpiredNotice ? (
            <p className="mt-4 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              Deine Sitzung ist abgelaufen oder nicht mehr gueltig. Bitte melde
              dich erneut an.
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
                E-Mail
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="h-12 w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-sm text-white"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
                Passwort
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="h-12 w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-sm text-white"
              />
            </label>

            {error && (
              <p className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-red-600 px-5 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {loading ? "Anmeldung..." : "Einloggen"}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between gap-3 text-sm text-white/60">
            <Link href="/" className="hover:text-white">
              Zur Website
            </Link>
            <Link href="/admin/forgot-password" className="hover:text-white">
              Passwort vergessen
            </Link>
          </div>

          {AUTH_REQUIRED_FOR_ADMIN && redirectTarget ? (
            <p className="mt-4 rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-xs text-white/60">
              Ziel nach Anmeldung: {redirectTarget}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
