"use client";

import { useState } from "react";
import {
  getPasswordChecklist,
  getPasswordStrength,
  validateAdminPassword,
} from "@/lib/admin-auth/passwordPolicy";

export default function PasswordForm({ loading, onSubmit, onResetEmail }) {
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [localError, setLocalError] = useState("");

  const checklist = getPasswordChecklist(password, repeatPassword);
  const strength = getPasswordStrength(password);
  const validation = validateAdminPassword(password, repeatPassword);
  const canSubmit = validation.isValid && !loading;

  async function handleSubmit(event) {
    event.preventDefault();
    setLocalError("");

    if (!validation.isValid) {
      setLocalError(validation.errors[0] || "Passwortregeln nicht erfuellt.");
      return;
    }

    const result = await onSubmit(password);

    if (result?.ok) {
      setPassword("");
      setRepeatPassword("");
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
            Neues Passwort
          </span>
          <div className="flex gap-2">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
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
              type={showRepeatPassword ? "text" : "password"}
              value={repeatPassword}
              onChange={(event) => setRepeatPassword(event.target.value)}
              className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white"
            />
            <button
              type="button"
              onClick={() => setShowRepeatPassword((current) => !current)}
              className="h-11 rounded-xl border border-white/15 bg-white/[0.06] px-3 text-xs font-bold text-white/80"
            >
              {showRepeatPassword ? "Verbergen" : "Anzeigen"}
            </button>
          </div>
        </label>

        <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/45">
            Passwortstaerke
          </p>
          <p className="mt-1 text-sm font-bold text-white/85">{strength}</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/45">
            Checkliste
          </p>
          <div className="mt-2 space-y-1.5">
            {checklist.map((entry) => (
              <p
                key={entry.key}
                className={`text-sm ${entry.valid ? "text-emerald-200" : "text-white/60"}`}
              >
                {entry.valid ? "Erfuellt" : "Offen"}: {entry.label}
              </p>
            ))}
          </div>
        </div>

        {localError ? (
          <p className="rounded-xl border border-red-400/35 bg-red-500/10 px-3 py-2 text-sm text-red-100">
            {localError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-60"
        >
          {loading ? "Aendern..." : "Passwort aendern"}
        </button>
      </form>

      <button
        type="button"
        onClick={onResetEmail}
        className="inline-flex h-10 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] px-4 text-sm font-bold text-white/80 transition hover:border-red-500/40 hover:text-white"
      >
        Passwort per E-Mail zuruecksetzen
      </button>
    </div>
  );
}
