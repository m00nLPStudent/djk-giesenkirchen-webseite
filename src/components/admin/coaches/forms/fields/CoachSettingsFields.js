import { InputField } from "@/components/admin/forms";

export default function CoachSettingsFields({ form, updateField }) {
  return (
    <div className="grid gap-4 md:grid-cols-[180px_1fr] md:items-end">
      <InputField
        label="Reihenfolge"
        type="number"
        value={form.sort_order}
        onChange={(event) => updateField("sort_order", event.target.value)}
      />

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
              Status
            </p>
            <p className="mt-1 text-sm text-white/60">
              Steuert, ob der Trainer öffentlich angezeigt wird.
            </p>
          </div>

          <button
            type="button"
            onClick={() => updateField("is_active", !form.is_active)}
            className={`rounded-full px-5 py-2 text-sm font-black transition ${
              form.is_active
                ? "bg-green-500/20 text-green-400"
                : "bg-yellow-500/20 text-yellow-400"
            }`}
          >
            {form.is_active ? "Aktiv" : "Inaktiv"}
          </button>
        </div>
      </div>
    </div>
  );
}
