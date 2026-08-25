import { FormSection } from "@/components/admin/forms";
import AdminMediaPicker from "@/components/admin/media-library/AdminMediaPicker";
import { resolveLoadedMediaImage } from "@/lib/people/publicMediaImage.mjs";
import TeamImagePlaceholder from "@/components/website/team/TeamImagePlaceholder";
import { COACH_PLACEHOLDER_IMAGE } from "@/constants/images";

function TeamImagePicker({ title, description, mediaId, legacyUrl, removed, selectedMedia, onMediaChange, loadMediaAction, uploadMediaAction, contact = false }) {
  const mediaUrls = selectedMedia?.previewUrl && mediaId ? new Map([[mediaId, selectedMedia.previewUrl]]) : new Map();
  const imageUrl = resolveLoadedMediaImage({ image_media_asset_id: mediaId, image_url: removed ? "" : legacyUrl }, mediaUrls);
  return <div className="rounded-2xl border border-white/10 p-4"><h3 className="text-lg font-black text-white">{title}</h3><p className="mb-4 mt-1 text-sm text-white/55">{description}</p><AdminMediaPicker value={selectedMedia} legacyUrl={selectedMedia || removed ? null : legacyUrl} placeholderUrl={contact ? COACH_PLACEHOLDER_IMAGE : ""} placeholder={contact ? null : <TeamImagePlaceholder className="h-full w-full" sizes="160px" />} onChange={onMediaChange} loadAction={loadMediaAction} uploadAction={uploadMediaAction} usageContext="team" entityLabel={title}/>{imageUrl ? <img src={imageUrl} alt={title} className="mt-5 max-h-72 w-full rounded-xl object-contain" /> : null}</div>;
}

export default function TeamMediaTab({ form, selectedMedia, selectedSeasonMedia, selectedContactMedia, selectedSeasonContactMedia, onMediaChange, onSeasonMediaChange, onContactMediaChange, onSeasonContactMediaChange, loadMediaAction, uploadMediaAction }) {
  return (
    <FormSection eyebrow="Medien" title="Bilder">
      <div className="grid gap-8">
        <div className="grid gap-5"><h2 className="text-xl font-black">Mannschaftsbilder</h2>
        <TeamImagePicker title="Saisonales Mannschaftsbild" description="Gilt nur für die aktuell ausgewählte Bearbeitungs-Saison und hat Vorrang vor dem allgemeinen Bild." mediaId={form.season_team_image_media_asset_id} legacyUrl={form.season_team_image_url} removed={form.remove_legacy_season_team_image} selectedMedia={selectedSeasonMedia} onMediaChange={onSeasonMediaChange} loadMediaAction={loadMediaAction} uploadMediaAction={uploadMediaAction}/>
        <TeamImagePicker title="Allgemeines Mannschaftsbild" description="Wird verwendet, wenn die ausgewählte Saison kein eigenes Bild besitzt." mediaId={form.team_image_media_asset_id} legacyUrl={form.team_image_url} removed={form.remove_legacy_team_image} selectedMedia={selectedMedia} onMediaChange={onMediaChange} loadMediaAction={loadMediaAction} uploadMediaAction={uploadMediaAction}/>
        </div>
        <div className="grid gap-5"><h2 className="text-xl font-black">Kontaktperson</h2>
        <TeamImagePicker contact title="Saisonales Kontaktbild" description="Foto der Kontaktperson für die aktuell ausgewählte Bearbeitungs-Saison." mediaId={form.season_contact_image_media_asset_id} legacyUrl={form.season_contact_image_url} removed={form.remove_legacy_season_contact_image} selectedMedia={selectedSeasonContactMedia} onMediaChange={onSeasonContactMediaChange} loadMediaAction={loadMediaAction} uploadMediaAction={uploadMediaAction}/>
        <TeamImagePicker contact title="Allgemeines Kontaktbild" description="Wird verwendet, wenn die ausgewählte Saison kein eigenes Kontaktbild besitzt." mediaId={form.contact_image_media_asset_id} legacyUrl={form.contact_image_url} removed={form.remove_legacy_contact_image} selectedMedia={selectedContactMedia} onMediaChange={onContactMediaChange} loadMediaAction={loadMediaAction} uploadMediaAction={uploadMediaAction}/>
        </div>
      </div>
    </FormSection>
  );
}
