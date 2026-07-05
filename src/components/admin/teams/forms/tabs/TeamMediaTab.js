import { FormSection } from "@/components/admin/forms";
import TeamLogoUpload from "../../components/TeamLogoUpload";

export default function TeamMediaTab({ form, onFieldChange, onUploadImage }) {
  return (
    <FormSection eyebrow="Medien" title="Mannschaftsbild">
      <TeamLogoUpload
        imageUrl={form.team_image_url}
        onUpload={onUploadImage}
        onRemove={() => onFieldChange("team_image_url", "")}
      />
    </FormSection>
  );
}
