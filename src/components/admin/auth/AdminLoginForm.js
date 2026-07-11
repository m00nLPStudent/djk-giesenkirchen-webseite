"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase.browser";
import { AUTH_REQUIRED_FOR_ADMIN } from "@/lib/admin-auth/adminAuthConfig";
import {
  getCurrentAdminContext,
  updateLastLoginAt,
} from "@/lib/admin-auth/adminSession.service";

export default function AdminLoginForm({ redirectTarget = "/admin" }) {
  const router = useRouter();

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
        router.replace(redirectTarget || "/admin");
      }
    }

    checkExistingSession();

    return () => {
      active = false;
    };
  }, [redirectTarget, router]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const supabaseBrowser = getSupabaseBrowserClient();
    if (!supabaseBrowser) {
      setLoading(false);
      setError("Browser-Kontext fehlt. Bitte Seite neu laden.");
      return;
    }

    const { data, error: signInError } = await supabaseBrowser.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setLoading(false);
      setError("Login fehlgeschlagen. Bitte Zugangsdaten pruefen.");
      return;
    }

    if (data?.user?.id) {
      await updateLastLoginAt(data.user.id);
    }

    if (!AUTH_REQUIRED_FOR_ADMIN) {
      setLoading(false);
      router.push("/admin");
      return;
    }

    const adminContext = await getCurrentAdminContext();
    setLoading(false);

    if (!adminContext?.user?.id) {
      router.push("/admin/login");
      return;
    }

    if (!adminContext?.hasAdminProfile) {
      router.push("/admin/unauthorized?reason=missing-admin-profile");
      return;
    }

    if (!adminContext?.isActive) {
      router.push("/admin/unauthorized?reason=inactive-user");
      return;
    }

    router.push(redirectTarget || "/admin");
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
