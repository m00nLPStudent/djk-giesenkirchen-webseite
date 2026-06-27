import { EmailField, FormGrid, PhoneField } from "@/components/admin/forms";

export default function CoachContactFields({ form, errors, updateField }) {
  return (
    <FormGrid>
      <EmailField
        required
        value={form.email}
        onChange={(value) => updateField("email", value)}
        error={errors.email}
      />

      <PhoneField
        required
        value={form.phone}
        onChange={(value) => updateField("phone", value)}
        error={errors.phone}
      />

      <PhoneField
        label="WhatsApp-Nummer"
        required
        placeholder="Internationale Schreibweise"
        value={form.whatsapp}
        onChange={(value) => updateField("whatsapp", value)}
        error={errors.whatsapp}
      />
    </FormGrid>
  );
}
