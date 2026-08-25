import { FormSection } from "@/components/admin/forms";
import AdminMediaPicker from "@/components/admin/media-library/AdminMediaPicker";
import { resolveLoadedMediaImage } from "@/lib/people/publicMediaImage.mjs";

export default function TeamMediaTab({ form, selectedMedia, onMediaChange, loadMediaAction, uploadMediaAction }) {
  const mediaUrls = selectedMedia?.previewUrl && form.team_image_media_asset_id ? new Map([[form.team_image_media_asset_id, selectedMedia.previewUrl]]) : new Map();
  const imageUrl = resolveLoadedMediaImage({ image_media_asset_id: form.team_image_media_asset_id, image_url: form.remove_legacy_team_image ? "" : form.team_image_url }, mediaUrls);
  return (
    <FormSection eyebrow="Medien" title="Mannschaftsbild">
      <AdminMediaPicker
        value={selectedMedia}
        legacyUrl={selectedMedia || form.remove_legacy_team_image ? null : form.team_image_url}
        placeholderUrl=""
        onChange={onMediaChange}
        loadAction={loadMediaAction}
        uploadAction={uploadMediaAction}
        usageContext="team"
        entityLabel="Mannschaftsbild"
      />
      {/* Signed admin URLs are rendered directly and expire after a short period. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {imageUrl ? <img src={imageUrl} alt="Mannschaftsbild" className="mt-5 max-h-72 w-full rounded-xl object-contain" /> : null}
    </FormSection>
  );
}
