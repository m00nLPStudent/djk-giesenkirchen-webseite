"use client";

import TeamCreateButton from "./TeamCreateButton";

export default function TeamsHeaderSearchControls({ searchValue = "", statusValue = "active" }) {
  return (
    <form
      method="get"
      action="/admin/teams"
      className="grid gap-3 pt-1 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center"
    >
      <input
        type="text"
        name="q"
        defaultValue={searchValue}
        placeholder="Mannschaft suchen..."
        className="h-12 w-full rounded-full border border-white/15 bg-black/20 px-5 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-red-500/60"
      />

      <select
        name="status"
        defaultValue={statusValue}
        aria-label="Mannschaftsstatus"
        className="h-12 rounded-full border border-white/15 bg-zinc-950 px-5 text-sm text-white"
      >
        <option value="active">Aktive</option>
        <option value="inactive">Inaktive</option>
        <option value="all">Alle</option>
      </select>

      <div className="flex items-center justify-end gap-2">
        <button
          type="submit"
          className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-bold text-white/80 transition hover:border-red-500/50 hover:text-white"
        >
          Suchen
        </button>
        <TeamCreateButton
          className="rounded-full bg-red-600 px-6 py-2.5 text-sm font-bold transition hover:bg-red-700"
          label="Neue Mannschaft"
        />
      </div>
    </form>
  );
}
