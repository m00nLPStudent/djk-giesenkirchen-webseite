const nonEmpty = (value) => typeof value === "string" && value.trim() ? value.trim() : null;

export function resolvePublicTeamImage({ mediaAssetId = null, teamLegacyUrl = null, seasonLegacyUrl = null } = {}, mediaUrls = new Map()) {
  const seasonImage = nonEmpty(seasonLegacyUrl);
  if (seasonImage) return seasonImage;
  return mediaUrls.get(mediaAssetId) || nonEmpty(teamLegacyUrl) || "";
}
