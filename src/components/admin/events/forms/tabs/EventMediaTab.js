import { FormSection } from "@/components/admin/forms";
import AdminImageUpload from "@/components/admin/media/AdminImageUpload";

export default function EventMediaTab({
  form,
  handleImageUpload,
  updateField,
}) {
  return (
    <FormSection
      eyebrow="Medien"
      title="Event-Bild"
      description="Optionales Bild für Kartenansicht und spätere öffentliche Darstellung."
    >
      <AdminImageUpload
        imageUrl={form.image_url}
        onUpload={handleImageUpload}
        onRemove={() => updateField("image_url", "")}
        description="Lade ein Bild für den Termin hoch."
        uploadLabel="Bild hochladen"
        removeLabel="Bild entfernen"
        alt={form.title_de || "Event-Bild"}
      />
    </FormSection>
  );
}
