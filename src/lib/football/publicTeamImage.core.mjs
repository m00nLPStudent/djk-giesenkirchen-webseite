const nonEmpty = (value) => typeof value === "string" && value.trim() ? value.trim() : null;

export const TEAM_PLACEHOLDER_IMAGE = "";
export const TEAM_PLACEHOLDER_ASSET_PATH = "/images/placeholders/team-placeholder.webp";

export function resolveTeamImage({
  seasonMediaAssetId = null,
  seasonLegacyUrl = null,
  teamMediaAssetId = null,
  teamLegacyUrl = null,
  placeholderUrl = TEAM_PLACEHOLDER_IMAGE,
} = {}, mediaUrls = new Map()) {
  return mediaUrls.get(seasonMediaAssetId)
    || nonEmpty(seasonLegacyUrl)
    || mediaUrls.get(teamMediaAssetId)
    || nonEmpty(teamLegacyUrl)
    || placeholderUrl;
}

export const resolvePublicTeamImage = resolveTeamImage;
