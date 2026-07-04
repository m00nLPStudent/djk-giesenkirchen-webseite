import { FormSection, InputField } from "@/components/admin/forms";

export default function EventSettingsTab({ form, publicUrl, updateField }) {
  return (
    <FormSection
      eyebrow="Einstellungen"
      title="Sichtbarkeit und Sortierung"
      description="Steuere Veröffentlichung und Hervorhebung im Vereinssystem."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(eventValue) =>
              updateField("is_published", eventValue.target.checked)
            }
          />
          Veröffentlicht
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70">
          <input
            type="checkbox"
            checked={form.is_featured}
            onChange={(eventValue) =>
              updateField("is_featured", eventValue.target.checked)
            }
          />
          Auf Startseite hervorheben
        </label>
      </div>

      <div className="mt-5 max-w-sm">
        <InputField
          label="Sortierung"
          type="number"
          min="0"
          value={form.sort_order}
          onChange={(eventValue) =>
            updateField("sort_order", Number(eventValue.target.value || 0))
          }
        />
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">
          Öffentlicher Link
        </p>
        <p className="mt-2 break-all text-sm text-white/70">
          {publicUrl || "Slug wird automatisch aus dem Titel erzeugt."}
        </p>
      </div>
    </FormSection>
  );
}
