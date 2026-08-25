const protectedFields = new Set(["author", "category", "title_en", "teaser_en", "content_en", "image_media_asset_id", "remove_legacy_image"]);

export function sanitizeNewsWritePayload(payload = {}) {
  return Object.fromEntries(Object.entries(payload).filter(([key]) => !protectedFields.has(key)));
}

export function resolveNewsAuthorName(profile = {}) {
  return profile.full_name?.trim() || profile.email?.trim() || "Unbekannter Autor";
}
