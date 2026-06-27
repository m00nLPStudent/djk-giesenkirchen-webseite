import { normalizeGermanPhoneNumber } from "@/lib/phone";
import { TextInput } from "./CoachFormField";

export default function CoachContactFields({ form, errors, updateField }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TextInput
        placeholder="E-Mail *"
        type="email"
        value={form.email}
        onChange={(event) => updateField("email", event.target.value)}
        error={errors.email}
      />

      <TextInput
        placeholder="Telefonnummer *"
        value={form.phone}
        onChange={(event) => updateField("phone", event.target.value)}
        onBlur={(event) => updateField("phone", normalizeGermanPhoneNumber(event.target.value))}
        error={errors.phone}
      />

      <TextInput
        placeholder="WhatsApp-Nummer *"
        value={form.whatsapp}
        onChange={(event) => updateField("whatsapp", event.target.value)}
        onBlur={(event) => updateField("whatsapp", normalizeGermanPhoneNumber(event.target.value))}
        error={errors.whatsapp}
      />
    </div>
  );
}
