import {
  FormGrid,
  FormSection,
  InputField,
  TextareaField,
} from "@/components/admin/forms";

export default function NewsMetaPanel({ form, updateField }) {
  return (
    <FormSection
      eyebrow="News"
      title="Grunddaten"
      description="Titel und kurzer Teaser für die News-Karten auf der Startseite und in der Übersicht."
    >
      <FormGrid columns={1}>
        <InputField
          label="Titel Deutsch"
          required
          value={form.title_de}
          onChange={(event) => updateField("title_de", event.target.value)}
        />
      </FormGrid>

      <div className="mt-5">
        <TextareaField
          label="Teaser Deutsch"
          rows={4}
          value={form.teaser_de}
          onChange={(event) => updateField("teaser_de", event.target.value)}
        />
      </div>
    </FormSection>
  );
}
