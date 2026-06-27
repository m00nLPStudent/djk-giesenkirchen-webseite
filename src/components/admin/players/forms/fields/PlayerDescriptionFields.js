import { FormGrid } from "@/components/admin/forms";
import { TextareaField } from "./FormField";

export default function PlayerDescriptionFields({ form, updateField }) {
  return (
    <FormGrid>
      <TextareaField
        label="Beschreibung Deutsch"
        placeholder="Beschreibung Deutsch"
        rows={5}
        value={form.description_de}
        onChange={(event) => updateField("description_de", event.target.value)}
      />

      <TextareaField
        label="Beschreibung Englisch"
        placeholder="Beschreibung Englisch"
        rows={5}
        value={form.description_en}
        onChange={(event) => updateField("description_en", event.target.value)}
      />
    </FormGrid>
  );
}
