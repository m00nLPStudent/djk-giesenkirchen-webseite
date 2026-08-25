import AdminMediaPicker from "@/components/admin/media-library/AdminMediaPicker";

export default function SponsorImageUpload({ selectedMedia, legacyUrl, onChange, loadAction, uploadAction }) {
  return <div className="[&_img]:object-contain">
    <AdminMediaPicker value={selectedMedia} legacyUrl={legacyUrl || ""} placeholderUrl="" onChange={onChange} loadAction={loadAction} uploadAction={uploadAction} usageContext="sponsor" entityLabel="Sponsorlogo" />
  </div>;
}
