import { TextInput } from "./CoachFormField";

export default function CoachBasicFields({ form, errors, updateField }) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput
          placeholder="Vorname *"
          value={form.first_name}
          onChange={(event) => updateField("first_name", event.target.value)}
          error={errors.first_name}
        />

        <TextInput
          placeholder="Nachname *"
          value={form.last_name}
          onChange={(event) => updateField("last_name", event.target.value)}
          error={errors.last_name}
        />
      </div>

      <input
        placeholder="Slug, z. B. swen-verbocket"
        value={form.slug}
        onChange={(event) => updateField("slug", event.target.value)}
        className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 outline-none focus:border-red-500"
      />
    </>
  );
}
