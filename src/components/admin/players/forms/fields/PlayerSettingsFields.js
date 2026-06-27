export default function PlayerSettingsFields({ form, updateField }) {
  return (
    <>
      <div>
        <label className="mb-2 block text-sm font-bold uppercase tracking-[0.25em] text-white/60">
          Reihenfolge
        </label>

        <input
          type="number"
          value={form.sort_order}
          onChange={(event) => updateField("sort_order", event.target.value)}
          className="h-14 w-32 rounded-2xl border border-white/10 bg-white/5 px-4 outline-none focus:border-red-500"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="rounded-2xl border border-white/10 bg-white/5 p-4 font-medium">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(event) => updateField("is_active", event.target.checked)}
            className="mr-3"
          />
          Spieler aktiv anzeigen
        </label>

        <label className="rounded-2xl border border-white/10 bg-white/5 p-4 font-medium">
          <input
            type="checkbox"
            checked={form.is_captain}
            onChange={(event) => updateField("is_captain", event.target.checked)}
            className="mr-3"
          />
          Spielführer
        </label>
      </div>
    </>
  );
}
