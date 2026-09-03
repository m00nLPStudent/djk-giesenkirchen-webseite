import { CURRENT_SEASON_STATUSES } from "@/components/admin/persons/seasonalReadModelCore.mjs";
import { PLAYER_PLACEHOLDER_IMAGE } from "../services/players.service";
import { validatePlayerRequiredFields } from "./playerFormValidation.core.mjs";
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

export function validatePlayerForm(form, sportContext = "football") {
  return validatePlayerRequiredFields(form, sportContext);
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
