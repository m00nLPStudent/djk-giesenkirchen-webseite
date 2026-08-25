import { FormSection } from "@/components/admin/forms";
import AdminMediaPicker from "@/components/admin/media-library/AdminMediaPicker";

export default function EventMediaTab({ form, selectedMedia, onMediaChange, loadMediaAction, uploadMediaAction }) {
  return (
    <FormSection eyebrow="Medien" title="Terminbild" description="Optionales Bild für Kartenansicht und öffentliche Detailansicht.">
      <AdminMediaPicker
        value={selectedMedia}
        legacyUrl={selectedMedia || form.remove_legacy_image ? null : form.image_url}
        placeholderUrl=""
        onChange={onMediaChange}
        loadAction={loadMediaAction}
        uploadAction={uploadMediaAction}
        usageContext="event"
        entityLabel="Terminbild"
      />
    </FormSection>
  );
}
