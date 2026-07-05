import { FormSection } from "@/components/admin/forms";
import NewsImageUpload from "./NewsImageUpload";

export default function NewsMediaPanel({ form, onUpload, onRemove }) {
  return (
    <FormSection
      eyebrow="Medien"
      title="News-Bild"
      description="Das Bild wird auf der Startseite, in der Übersicht und später in der Detailansicht verwendet."
    >
      <NewsImageUpload
        imageUrl={form.image_url}
        onUpload={onUpload}
        onRemove={onRemove}
      />
    </FormSection>
  );
}
