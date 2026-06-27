import { FormGrid } from "@/components/admin/forms";
import { normalizeGermanPhoneNumber } from "@/lib/phone";
import { TextInput } from "./CoachFormField";

export default function CoachContactFields({ form, errors, updateField }) {
  return (
    <FormGrid>
      <TextInput
        label="E-Mail"
        required
        placeholder="name@example.de"
        type="email"
        value={form.email}
        onChange={(event) => updateField("email", event.target.value)}
        error={errors.email}
      />

      <TextInput
        label="Telefonnummer"
        required
        placeholder="01590..."
        value={form.phone}
        onChange={(event) => updateField("phone", event.target.value)}
        onBlur={(event) => updateField("phone", normalizeGermanPhoneNumber(event.target.value))}
        error={errors.phone}
      />

      <TextInput
        label="WhatsApp-Nummer"
        required
        placeholder="491590..."
        value={form.whatsapp}
        onChange={(event) => updateField("whatsapp", event.target.value)}
        onBlur={(event) => updateField("whatsapp", normalizeGermanPhoneNumber(event.target.value))}
        error={errors.whatsapp}
      />
    </FormGrid>
  );
}
