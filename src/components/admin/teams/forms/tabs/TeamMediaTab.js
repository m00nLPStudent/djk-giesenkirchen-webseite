import { FormSection } from "@/components/admin/forms";
import AdminMediaPicker from "@/components/admin/media-library/AdminMediaPicker";
import { resolveLoadedMediaImage } from "@/lib/people/publicMediaImage.mjs";
import TeamImagePlaceholder from "@/components/website/team/TeamImagePlaceholder";

function TeamImagePicker({ title, description, mediaId, legacyUrl, removed, selectedMedia, onMediaChange, loadMediaAction, uploadMediaAction }) {
  const mediaUrls = selectedMedia?.previewUrl && mediaId ? new Map([[mediaId, selectedMedia.previewUrl]]) : new Map();
  const imageUrl = resolveLoadedMediaImage({ image_media_asset_id: mediaId, image_url: removed ? "" : legacyUrl }, mediaUrls);
  return <div className="rounded-2xl border border-white/10 p-4"><h3 className="text-lg font-black text-white">{title}</h3><p className="mb-4 mt-1 text-sm text-white/55">{description}</p><AdminMediaPicker value={selectedMedia} legacyUrl={selectedMedia || removed ? null : legacyUrl} placeholderUrl="" placeholder={<TeamImagePlaceholder className="h-full w-full" sizes="160px" />} onChange={onMediaChange} loadAction={loadMediaAction} uploadAction={uploadMediaAction} usageContext="team" entityLabel={title}/>{imageUrl ? <img src={imageUrl} alt={title} className="mt-5 max-h-72 w-full rounded-xl object-contain" /> : null}</div>;
}

export default function TeamMediaTab({ form, selectedMedia, selectedSeasonMedia, onMediaChange, onSeasonMediaChange, loadMediaAction, uploadMediaAction }) {
  return (
    <FormSection eyebrow="Medien" title="Mannschaftsbilder">
      <div className="grid gap-5">
        <TeamImagePicker title="Saisonales Mannschaftsbild" description="Gilt nur für die aktuell ausgewählte Bearbeitungs-Saison und hat Vorrang vor dem allgemeinen Bild." mediaId={form.season_team_image_media_asset_id} legacyUrl={form.season_team_image_url} removed={form.remove_legacy_season_team_image} selectedMedia={selectedSeasonMedia} onMediaChange={onSeasonMediaChange} loadMediaAction={loadMediaAction} uploadMediaAction={uploadMediaAction}/>
        <TeamImagePicker title="Allgemeines Mannschaftsbild" description="Wird verwendet, wenn die ausgewählte Saison kein eigenes Bild besitzt." mediaId={form.team_image_media_asset_id} legacyUrl={form.team_image_url} removed={form.remove_legacy_team_image} selectedMedia={selectedMedia} onMediaChange={onMediaChange} loadMediaAction={loadMediaAction} uploadMediaAction={uploadMediaAction}/>
      </div>
    </FormSection>
  );
}
