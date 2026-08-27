"use client";

import { useState } from "react";

export default function ProfileForm({
  fullName,
  email,
  initialNickname,
  initialPhone,
  loading,
  onSubmit,
  statusMessage,
}) {
  const [nickname, setNickname] = useState(initialNickname || "");
  const [phone, setPhone] = useState(initialPhone || "");

  async function handleSubmit(event) {
    event.preventDefault();
    const result = await onSubmit({ nickname, phone });
    if (result?.ok) {
      setNickname(result.nickname || "");
      setPhone(result.phone || "");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block space-y-2">
        <span className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
          Offizieller Name
        </span>
        <input
          type="text"
          value={fullName}
          readOnly
          className="h-10 w-full rounded-xl border border-white/10 bg-black/35 px-3 text-sm text-white/65"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
          Login-E-Mail
        </span>
        <input
          type="email"
          value={email || ""}
          readOnly
          className="h-10 w-full rounded-xl border border-white/10 bg-black/35 px-3 text-sm text-white/65"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Nickname</span>
          <input type="text" maxLength={80} value={nickname} onChange={(event) => setNickname(event.target.value)} className="h-10 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white" placeholder="Optional" />
        </label>
        <label className="block space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Telefonnummer</span>
          <input type="tel" maxLength={40} value={phone} onChange={(event) => setPhone(event.target.value)} className="h-10 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white" placeholder="Optional" />
        </label>
      </div>

      {statusMessage ? (
        <p className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white/75">
          {statusMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-60"
      >
        {loading ? "Speichern..." : "Profil speichern"}
      </button>
    </form>
  );
}
