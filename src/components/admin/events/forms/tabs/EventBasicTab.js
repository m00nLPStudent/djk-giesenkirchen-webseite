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
      <FormGrid>
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
        <InputField
          label="Titel Englisch"
          value={form.title_en}
          onChange={(eventValue) =>
            updateField("title_en", eventValue.target.value)
          }
        />
      </FormGrid>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <TextareaField
          label="Teaser Deutsch"
          rows={4}
          value={form.teaser_de}
          onChange={(eventValue) =>
            updateField("teaser_de", eventValue.target.value)
          }
        />
        <TextareaField
          label="Teaser Englisch"
          rows={4}
          value={form.teaser_en}
          onChange={(eventValue) =>
            updateField("teaser_en", eventValue.target.value)
          }
        />
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <TextareaField
          label="Beschreibung Deutsch"
          rows={8}
          value={form.description_de}
          onChange={(eventValue) =>
            updateField("description_de", eventValue.target.value)
          }
        />
        <TextareaField
          label="Beschreibung Englisch"
          rows={8}
          value={form.description_en}
          onChange={(eventValue) =>
            updateField("description_en", eventValue.target.value)
          }
        />
      </div>
    </FormSection>
  );
}
