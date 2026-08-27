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
  const strengthStyle = strength === "Stark" ? "w-full bg-emerald-500" : strength === "Mittel" ? "w-2/3 bg-amber-400" : "w-1/3 bg-red-500";

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
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid gap-3 lg:grid-cols-2">
        <label className="block space-y-1.5">
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

        <label className="block space-y-1.5">
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
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs"><span className="font-black uppercase tracking-[0.14em] text-white/45">Passwortstärke</span><span className="font-bold text-white/70">{strength}</span></div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full transition-all ${strengthStyle}`} /></div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {checklist.map((entry) => (
              <span
                key={entry.key}
                className={`text-xs ${entry.valid ? "text-emerald-200" : "text-white/50"}`}
              >
                {entry.valid ? "✓" : "○"} {entry.label}
              </span>
            ))}
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
