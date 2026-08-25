import { FormSection } from "@/components/admin/forms";
import AdminMediaPicker from "@/components/admin/media-library/AdminMediaPicker";

export default function NewsMediaPanel({ form, selectedMedia, onMediaChange, loadMediaAction, uploadMediaAction }) {
  return (
    <FormSection
      eyebrow="Medien"
      title="News-Bild"
      description="Das Bild wird auf der Startseite, in der Übersicht und später in der Detailansicht verwendet."
    >
      <AdminMediaPicker value={selectedMedia} legacyUrl={selectedMedia || form.remove_legacy_image ? null : form.image_url} placeholderUrl="" onChange={onMediaChange} loadAction={loadMediaAction} uploadAction={uploadMediaAction} usageContext="news" entityLabel="News-Titelbild" />
    </FormSection>
  );
}
