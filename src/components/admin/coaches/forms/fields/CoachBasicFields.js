import { FormGrid } from "@/components/admin/forms";
import { TextInput } from "./CoachFormField";

export default function CoachBasicFields({ form, errors, updateField }) {
  return (
    <div className="space-y-4">
      <FormGrid>
        <TextInput
          label="Vorname"
          required
          placeholder="Vorname"
          value={form.first_name}
          onChange={(event) => updateField("first_name", event.target.value)}
          error={errors.first_name}
        />

        <TextInput
          label="Nachname"
          required
          placeholder="Nachname"
          value={form.last_name}
          onChange={(event) => updateField("last_name", event.target.value)}
          error={errors.last_name}
        />
      </FormGrid>

      <TextInput
        label="Slug"
        placeholder="z. B. swen-verbocket"
        value={form.slug}
        onChange={(event) => updateField("slug", event.target.value)}
      />
    </div>
  );
}
