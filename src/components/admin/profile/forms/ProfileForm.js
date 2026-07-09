"use client";

import { useEffect, useState } from "react";

export default function ProfileForm({
  initialFullName,
  email,
  loading,
  onSubmit,
  statusMessage,
}) {
  const [fullName, setFullName] = useState(initialFullName || "");

  useEffect(() => {
    setFullName(initialFullName || "");
  }, [initialFullName]);

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit(fullName);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block space-y-2">
        <span className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
          Name
        </span>
        <input
          type="text"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white"
          placeholder="Vollstaendiger Name"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
          E-Mail (read only)
        </span>
        <input
          type="email"
          value={email || ""}
          readOnly
          className="h-11 w-full rounded-xl border border-white/10 bg-black/35 px-3 text-sm text-white/65"
        />
      </label>

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
