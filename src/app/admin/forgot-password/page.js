"use client";

import Link from "next/link";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase.browser";
import { buildAdminRedirectUrl } from "@/lib/admin-auth/adminAuthRedirects";

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const supabaseBrowser = getSupabaseBrowserClient();
    if (!supabaseBrowser) {
      setLoading(false);
      setError("Browser-Kontext fehlt. Bitte Seite neu laden.");
      return;
    }

    const redirectTo = buildAdminRedirectUrl("/admin/set-password", {
      browserOrigin: window.location.origin,
    });

    if (!redirectTo) {
      setLoading(false);
      setError(
        "Redirect-URL fehlt. Bitte NEXT_PUBLIC_SITE_URL oder ADMIN_AUTH_REDIRECT_URL konfigurieren.",
      );
      return;
    }

    const { error: resetError } =
      await supabaseBrowser.auth.resetPasswordForEmail(email, { redirectTo });

    setLoading(false);

    if (resetError) {
      setError("Reset-Link konnte nicht gesendet werden.");
      return;
    }

    setSuccess("Wenn die E-Mail existiert, wurde ein Reset-Link gesendet.");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.14),transparent_35%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_28%),#101014] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <section className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.22)] sm:p-8">
          <p className="text-[0.65rem] font-black uppercase tracking-[0.35em] text-red-400">
            Admin Auth
          </p>
          <h1 className="mt-3 text-3xl font-black">Passwort vergessen</h1>

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

            {error && (
              <p className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {error}
              </p>
            )}
            {success && (
              <p className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-red-600 px-5 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {loading ? "Senden..." : "Reset-Link senden"}
            </button>
          </form>

          <div className="mt-5">
            <Link
              href="/admin/login"
              className="text-sm text-white/60 hover:text-white"
            >
              Zurueck zum Login
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
