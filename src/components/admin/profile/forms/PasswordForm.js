"use client";

import { useState } from "react";

export default function PasswordForm({ loading, onSubmit, onResetEmail }) {
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [localError, setLocalError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLocalError("");

    if (password.length < 8) {
      setLocalError("Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }

    if (password !== repeatPassword) {
      setLocalError("Passwoerter stimmen nicht ueberein.");
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
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
            Passwort wiederholen
          </span>
          <input
            type="password"
            value={repeatPassword}
            onChange={(event) => setRepeatPassword(event.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white"
          />
        </label>

        {localError ? (
          <p className="rounded-xl border border-red-400/35 bg-red-500/10 px-3 py-2 text-sm text-red-100">
            {localError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
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
