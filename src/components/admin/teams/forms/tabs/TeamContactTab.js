import {
  EmailField,
  FormSection,
  InputField,
  PhoneField,
} from "@/components/admin/forms";

export default function TeamContactTab({ form, onFieldChange }) {
  return (
    <FormSection eyebrow="Kontakt" title="Ansprechpartner">
      <div className="space-y-4">
        <InputField
          label="Ansprechpartner"
          value={form.contact_name}
          onChange={(event) =>
            onFieldChange("contact_name", event.target.value)
          }
        />
        <EmailField
          value={form.contact_email}
          onChange={(value) => onFieldChange("contact_email", value)}
        />
        <PhoneField
          value={form.contact_phone}
          onChange={(value) => onFieldChange("contact_phone", value)}
        />
      </div>
    </FormSection>
  );
}
