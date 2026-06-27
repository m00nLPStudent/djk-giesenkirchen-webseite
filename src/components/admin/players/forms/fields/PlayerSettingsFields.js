import { InputField, StatusSwitch } from "@/components/admin/forms";

function CaptainSwitch({ checked, onChange }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
            Spielführer
          </p>
          <p className="mt-2 text-sm leading-6 text-white/60">
            Markiert den Spieler als Kapitän der Mannschaft.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onChange(!checked)}
          className={`rounded-full px-5 py-2 text-sm font-black transition ${
            checked ? "bg-red-600 text-white" : "bg-white/10 text-white/50"
          }`}
        >
          {checked ? "Ja" : "Nein"}
        </button>
      </div>
    </div>
  );
}

export default function PlayerSettingsFields({ form, updateField }) {
  return (
    <div className="space-y-6">
      <div className="max-w-xs">
        <InputField
          label="Reihenfolge"
          type="number"
          value={form.sort_order}
          onChange={(event) => updateField("sort_order", event.target.value)}
        />
      </div>

      <StatusSwitch
        checked={form.is_active}
        onChange={(value) => updateField("is_active", value)}
        description="Steuert, ob der Spieler öffentlich angezeigt wird."
      />

      <CaptainSwitch
        checked={form.is_captain}
        onChange={(value) => updateField("is_captain", value)}
      />
    </div>
  );
}
