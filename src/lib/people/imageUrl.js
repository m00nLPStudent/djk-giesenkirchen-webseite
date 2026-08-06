function normalizeText(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function resolveImageUrl(entity = {}, fallbackImage = null) {
  return (
    normalizeText(entity.mediaAsset?.previewUrl) ||
    normalizeText(entity.media_asset?.previewUrl) ||
    normalizeText(entity.imageUrl) ||
    normalizeText(entity.image_url) ||
    normalizeText(entity.photo_url) ||
    fallbackImage
  );
}

export function resolvePlayerImageUrl(player = {}, fallbackImage = null) {
  return resolveImageUrl(player, fallbackImage);
}

export function resolveCoachImageUrl(coach = {}, fallbackImage = null) {
  return resolveImageUrl(coach, fallbackImage);
}
