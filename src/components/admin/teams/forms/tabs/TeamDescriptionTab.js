import { FormSection, TextareaField } from "@/components/admin/forms";

export default function TeamDescriptionTab({ form, onFieldChange }) {
  return (
    <FormSection eyebrow="Beschreibung" title="Mannschaftsbeschreibung">
      <div className="space-y-4">
        <TextareaField
          label="Beschreibung Deutsch"
          rows={8}
          value={form.description_de}
          onChange={(event) =>
            onFieldChange("description_de", event.target.value)
          }
        />
      </div>
    </FormSection>
  );
}
