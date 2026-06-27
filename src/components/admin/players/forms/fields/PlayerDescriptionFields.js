import { TextareaField } from "./FormField";

export default function PlayerDescriptionFields({ form, updateField }) {
  return (
    <>
      <TextareaField
        placeholder="Beschreibung Deutsch"
        rows={5}
        value={form.description_de}
        onChange={(event) => updateField("description_de", event.target.value)}
      />

      <TextareaField
        placeholder="Beschreibung Englisch"
        rows={5}
        value={form.description_en}
        onChange={(event) => updateField("description_en", event.target.value)}
      />
    </>
  );
}
