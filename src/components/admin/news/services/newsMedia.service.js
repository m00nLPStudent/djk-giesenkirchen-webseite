import "server-only";
import { loadPublicMediaUrlMap } from "@/components/admin/media-library/media.service";
import { resolveLoadedPublicMediaImage } from "@/lib/people/publicMediaImage.mjs";

export async function resolvePublicNewsImages(items = []) {
  const rows = items.filter(Boolean);
  const media = await loadPublicMediaUrlMap(rows.map((item) => item.image_media_asset_id));
  return rows.map((item) => ({
    ...item,
    resolved_image_url: resolveLoadedPublicMediaImage({ image_media_asset_id: item.image_media_asset_id, image_url: item.image_url }, media.data),
  }));
}

export async function resolvePublicNewsDocuments(items = []) {
  const rows = items.filter((item) => item?.is_public);
  const media = await loadPublicMediaUrlMap(rows.map((item) => item.media_asset_id), "document");
  return rows.map((item) => ({
    ...item,
    resolved_file_url: item.media_asset_id ? media.data.get(item.media_asset_id) || null : item.file_url || null,
  })).filter((item) => item.resolved_file_url);
}
