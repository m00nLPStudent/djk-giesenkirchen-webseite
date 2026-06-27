export default function CoachSettingsFields({ form, updateField }) {
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

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <label className="flex items-center gap-3 text-white">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(event) => updateField("is_active", event.target.checked)}
          />

          <span className="font-medium">Trainer aktiv anzeigen</span>
        </label>
      </div>
    </>
  );
}
