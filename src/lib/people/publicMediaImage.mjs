export const PUBLIC_MEDIA_BUCKET = "media-library-public";

export function resolvePublicMediaImage(record = {}, getPublicUrl, placeholder = "") {
  const asset = record.image_media_asset;
  const validAsset = record.image_media_asset_id && asset && !asset.is_archived
    && asset.media_kind === "image" && asset.visibility === "public"
    && asset.storage_bucket === PUBLIC_MEDIA_BUCKET;
  if (validAsset && typeof getPublicUrl === "function") {
    const url = getPublicUrl(asset.storage_bucket, asset.storage_path);
    if (url) return url;
  }
  return record.image_url || placeholder;
}

export function resolveLoadedMediaImage(record = {}, mediaUrls = new Map(), placeholder = "") {
  return mediaUrls.get(record.image_media_asset_id) || record.image_url || placeholder;
}

export const resolveLoadedPublicMediaImage = resolveLoadedMediaImage;
