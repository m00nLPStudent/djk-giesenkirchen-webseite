import { validateRequiredFields } from "@/components/admin/utils/validation";
import { CURRENT_SEASON_STATUSES } from "@/components/admin/persons/seasonalReadModelCore.mjs";
import { PLAYER_PLACEHOLDER_IMAGE } from "../services/players.service";
import { REQUIRED_PLAYER_FIELDS } from "./playerForm.config";
import {
  createInitialPlayerFormData,
  createPlayerPayloadData,
  getPlayerFormBlockingMessageData,
  getPlayerFormWarningMessageData,
  getYearGroupFromBirthdate,
} from "./playerForm.core.mjs";

export function createInitialPlayerForm(
  player,
  playerSeasonalReadModel,
) {
  return createInitialPlayerFormData(
    player,
    playerSeasonalReadModel,
    PLAYER_PLACEHOLDER_IMAGE,
  );
}
export { getYearGroupFromBirthdate };

export function validatePlayerForm(form) {
  return validateRequiredFields(form, REQUIRED_PLAYER_FIELDS);
}

export function createPlayerPayload(form, yearGroup) {
  return createPlayerPayloadData(form, yearGroup, PLAYER_PLACEHOLDER_IMAGE);
}

export function getPlayerFormBlockingMessage(
  teamOptionsResult,
  playerSeasonalReadModel,
) {
  return getPlayerFormBlockingMessageData(
    teamOptionsResult,
    playerSeasonalReadModel,
    CURRENT_SEASON_STATUSES,
  );
}

export function getPlayerFormWarningMessage(
  playerSeasonalReadModel,
) {
  return getPlayerFormWarningMessageData(
    playerSeasonalReadModel,
    CURRENT_SEASON_STATUSES,
  );
}
