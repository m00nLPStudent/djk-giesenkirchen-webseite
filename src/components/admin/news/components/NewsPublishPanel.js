import { FormSection, InputField } from "@/components/admin/forms";

export default function NewsPublishPanel({ form, updateField }) {
  return (
    <FormSection
      eyebrow="Einstellungen"
      title="Veröffentlichung"
      description="Steuere, ob die News sofort, geplant oder als Entwurf gespeichert wird."
    >
      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70">
        <input
          type="checkbox"
          checked={form.is_published}
          onChange={(event) =>
            updateField("is_published", event.target.checked)
          }
        />
        Zur Veröffentlichung freigeben
      </label>

      <div className="mt-5">
        <InputField
          label="Veröffentlichungsdatum"
          type="datetime-local"
          value={form.published_at}
          onChange={(event) => updateField("published_at", event.target.value)}
        />
        <p className="mt-2 text-sm text-white/40">
          Leer lassen = direkte Veröffentlichung. Datum in der Zukunft =
          geplante Veröffentlichung.
        </p>
      </div>
    </FormSection>
  );
}
