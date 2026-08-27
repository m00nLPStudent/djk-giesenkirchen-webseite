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

const INVALID_LINK_MESSAGE = "Der Link zum Zurücksetzen des Passworts ist ungültig oder abgelaufen. Bitte fordere einen neuen Link an.";

async function resolveExistingInviteSession(supabaseBrowser) {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const isInvite = params.get("type") === "invite";
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (!isInvite || !accessToken || !refreshToken) return false;
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  const { data, error } = await supabaseBrowser.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  return !error && Boolean(data?.session?.user?.id);
}

export default function SetPasswordForm({ initialRecoverySession = false }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(initialRecoverySession ? "" : INVALID_LINK_MESSAGE);
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

      let valid = false;
      if (initialRecoverySession) {
        const { data, error: sessionError } = await supabaseBrowser.auth.getSession();
        valid = !sessionError && Boolean(data?.session?.user?.id);
      } else {
        valid = await resolveExistingInviteSession(supabaseBrowser);
      }
      if (!active) return;
      setHasRecoverySession(valid);
      setError(valid ? "" : INVALID_LINK_MESSAGE);
      setLoading(false);
    }

    void Promise.resolve().then(initialize);

    return () => {
      active = false;
    };
  }, [initialRecoverySession]);

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
      setError("Passwort konnte nicht gesetzt werden. Bitte fordere gegebenenfalls einen neuen Link an.");
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
