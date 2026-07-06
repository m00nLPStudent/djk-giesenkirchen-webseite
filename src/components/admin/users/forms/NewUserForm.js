export default function NewUserForm({ roles }) {
  return (
    <form className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Vorname</span>
          <input
            type="text"
            placeholder="Max"
            className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white placeholder:text-white/35"
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Nachname</span>
          <input
            type="text"
            placeholder="Mustermann"
            className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white placeholder:text-white/35"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Name</span>
          <input
            type="text"
            placeholder="Max Mustermann"
            className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white placeholder:text-white/35"
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-white/45">E-Mail</span>
          <input
            type="email"
            placeholder="max@verein.de"
            className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white placeholder:text-white/35"
          />
        </label>
      </div>

      <label className="inline-flex items-center gap-3 text-sm text-white/80">
        <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-white/20 bg-black/30" />
        Aktiv
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Primaere Rolle</span>
          <select className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white">
            <option value="" className="bg-slate-900">Bitte auswaehlen</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id} className="bg-slate-900">{role.name}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Weitere Rollen</span>
          <select multiple className="h-24 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white">
            {roles.map((role) => (
              <option key={role.id} value={role.id} className="bg-slate-900">{role.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-xl border border-amber-300/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        Das Anlegen von Auth-Benutzern folgt in Phase B6.
      </div>

      <button
        type="button"
        disabled
        className="inline-flex h-11 items-center justify-center rounded-xl bg-red-600/60 px-5 text-sm font-black text-white/70"
      >
        Speichern (Phase B6)
      </button>
    </form>
  );
}
