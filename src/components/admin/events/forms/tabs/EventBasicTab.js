import {
  FormGrid,
  FormSection,
  InputField,
  TextareaField,
} from "@/components/admin/forms";
import { createSlug } from "@/lib/slug";

export default function EventBasicTab({ form, isEdit, event, updateField }) {
  return (
    <FormSection
      eyebrow="Termine"
      title="Grunddaten"
      description="Titel, Teaser und Beschreibung für den Termin oder die Veranstaltung."
    >
      <FormGrid columns={1}>
        <InputField
          label="Titel Deutsch"
          required
          value={form.title_de}
          onChange={(eventValue) => {
            const nextTitle = eventValue.target.value;
            updateField("title_de", nextTitle);
            if (!isEdit || !event?.slug || event.slug === form.slug) {
              updateField("slug", createSlug(nextTitle));
            }
          }}
        />
      </FormGrid>

      <div className="mt-5">
        <TextareaField
          label="Teaser Deutsch"
          rows={4}
          value={form.teaser_de}
          onChange={(eventValue) =>
            updateField("teaser_de", eventValue.target.value)
          }
        />
      </div>

      <div className="mt-5">
        <TextareaField
          label="Beschreibung Deutsch"
          rows={8}
          value={form.description_de}
          onChange={(eventValue) =>
            updateField("description_de", eventValue.target.value)
          }
        />
      </div>
    </FormSection>
  );
}
