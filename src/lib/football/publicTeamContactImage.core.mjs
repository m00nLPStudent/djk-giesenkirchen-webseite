import { COACH_PLACEHOLDER_IMAGE } from "../../constants/images.js";

export function resolveTeamContactImage(input = {}, mediaUrls = new Map(), placeholder = COACH_PLACEHOLDER_IMAGE) {
  return mediaUrls.get(input.seasonMediaAssetId)
    || input.seasonLegacyUrl
    || mediaUrls.get(input.teamMediaAssetId)
    || input.teamLegacyUrl
    || placeholder;
}
