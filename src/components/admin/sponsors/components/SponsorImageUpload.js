import { AdminImageUpload } from "@/components/admin/media";

export default function SponsorImageUpload(props) {
  return (
    <AdminImageUpload
      {...props}
      placeholderUrl=""
      alt="Sponsor-Banner"
      description="Sponsor-Banner oder Logo hochladen. Die Anzeige wird auf der Website automatisch einheitlich skaliert."
      uploadLabel="Banner auswählen"
      removeLabel="Banner entfernen"
    />
  );
}
