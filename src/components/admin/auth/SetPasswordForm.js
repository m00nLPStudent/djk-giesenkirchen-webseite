"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase.browser";
import {
  getPasswordChecklist,
  getPasswordStrength,
  validateAdminPassword,
} from "@/lib/admin-auth/passwordPolicy";
import PasswordChecklist from "./PasswordChecklist";
import PasswordStrength from "./PasswordStrength";

async function resolveRecoverySession(supabaseBrowser) {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");

  if (code) {
    const { error } = await supabaseBrowser.auth.exchangeCodeForSession(code);
    if (error) {
      return {
        ok: false,
        message:
          error.message || "Einladungslink konnte nicht verarbeitet werden.",
      };
    }
  }

  const hash = window.location.hash.replace(/^#/, "");
  const hashParams = new URLSearchParams(hash);
  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");

  if (accessToken && refreshToken) {
    const { error } = await supabaseBrowser.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      return {
        ok: false,
        message:
          error.message || "Recovery-Session konnte nicht hergestellt werden.",
      };
    }
  }

  const { data, error } = await supabaseBrowser.auth.getSession();
  if (error) {
    return {
      ok: false,
      message: error.message || "Session konnte nicht gelesen werden.",
    };
  }

  if (!data?.session?.user?.id) {
    return {
      ok: false,
      message:
        "Kein gueltiger Einladungs- oder Reset-Link gefunden. Bitte neuen Link anfordern.",
    };
  }

  return { ok: true };
}

export default function SetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  const checklist = useMemo(
    () => getPasswordChecklist(password, confirmPassword),
    [password, confirmPassword],
  );
  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const validation = useMemo(
    () => validateAdminPassword(password, confirmPassword),
    [password, confirmPassword],
  );

  useEffect(() => {
    let active = true;

    async function initialize() {
      setLoading(true);
      setError("");

      const supabaseBrowser = getSupabaseBrowserClient();
      if (!supabaseBrowser) {
        if (!active) return;
        setError("Browser-Kontext fehlt. Bitte Seite neu laden.");
        setHasRecoverySession(false);
        setLoading(false);
        return;
      }

      const result = await resolveRecoverySession(supabaseBrowser);
      if (!active) return;

      setHasRecoverySession(Boolean(result.ok));
      setError(result.ok ? "" : result.message);
      setLoading(false);
    }

    initialize();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!hasRecoverySession || saving || !validation.isValid) return;

    setSaving(true);
    setError("");
    setSuccess("");

    const supabaseBrowser = getSupabaseBrowserClient();
    if (!supabaseBrowser) {
      setSaving(false);
      setError("Browser-Kontext fehlt. Bitte Seite neu laden.");
      return;
    }

    const { error: updateError } = await supabaseBrowser.auth.updateUser({
      password,
    });

    if (updateError) {
      setSaving(false);
      setError(updateError.message || "Passwort konnte nicht gesetzt werden.");
      return;
    }

    await supabaseBrowser.auth.signOut();
    setSaving(false);
    setSuccess(
      "Passwort wurde erfolgreich gesetzt. Weiterleitung zum Login...",
    );
    window.setTimeout(() => {
      router.push("/admin/login");
    }, 700);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {loading ? (
        <p className="rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/70">
          Link wird geprueft...
        </p>
      ) : null}

      {!loading && error ? (
        <p className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      ) : null}

      {!loading && success ? (
        <p className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {success}
        </p>
      ) : null}

      <label className="block space-y-2">
        <span className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
          Neues Passwort
        </span>
        <div className="flex gap-2">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={!hasRecoverySession || loading || saving}
            className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="h-11 rounded-xl border border-white/15 bg-white/[0.06] px-3 text-xs font-bold text-white/80"
          >
            {showPassword ? "Verbergen" : "Anzeigen"}
          </button>
        </div>
      </label>

      <label className="block space-y-2">
        <span className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
          Passwort wiederholen
        </span>
        <div className="flex gap-2">
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            disabled={!hasRecoverySession || loading || saving}
            className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((current) => !current)}
            className="h-11 rounded-xl border border-white/15 bg-white/[0.06] px-3 text-xs font-bold text-white/80"
          >
            {showConfirmPassword ? "Verbergen" : "Anzeigen"}
          </button>
        </div>
      </label>

      <PasswordStrength strength={strength} />
      <PasswordChecklist checklist={checklist} />

      <button
        type="submit"
        disabled={
          !hasRecoverySession || loading || saving || !validation.isValid
        }
        className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-60"
      >
        {saving ? "Speichern..." : "Passwort speichern"}
      </button>

      <div className="text-center">
        <Link
          href="/admin/login"
          className="text-sm text-white/60 hover:text-white"
        >
          Zum Login
        </Link>
      </div>
    </form>
  );
}
