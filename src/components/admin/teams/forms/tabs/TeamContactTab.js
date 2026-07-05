import {
  EmailField,
  FormSection,
  InputField,
  PhoneField,
} from "@/components/admin/forms";
import TeamLogoUpload from "../../components/TeamLogoUpload";

export default function TeamContactTab({
  form,
  onFieldChange,
  onUploadContactImage,
}) {
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
        <TeamLogoUpload
          imageUrl={form.contact_image_url}
          onUpload={onUploadContactImage}
          onRemove={() => onFieldChange("contact_image_url", "")}
        />
      </div>
    </FormSection>
  );
}
