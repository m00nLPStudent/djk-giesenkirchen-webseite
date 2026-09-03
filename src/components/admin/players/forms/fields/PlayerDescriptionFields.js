import { TextareaField } from "./FormField";

export default function PlayerDescriptionFields({ form, updateField }) {
  return (
    <div>
      <TextareaField
        label="Beschreibung Deutsch"
        placeholder="Beschreibung Deutsch"
        rows={5}
        value={form.description_de}
        onChange={(event) => updateField("description_de", event.target.value)}
      />

    </div>
  );
}
