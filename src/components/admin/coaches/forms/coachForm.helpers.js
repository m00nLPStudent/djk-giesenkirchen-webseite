import { COACH_PLACEHOLDER_IMAGE } from "@/constants/images";
import { createSlug } from "@/lib/slug";
import { normalizeGermanPhoneNumber } from "@/lib/phone";
import { CURRENT_SEASON_STATUSES } from "@/components/admin/persons/seasonalReadModelCore.mjs";
import { REQUIRED_COACH_FIELDS } from "./coachForm.config";
import {
  createCoachAssignmentDraft,
  createCoachSubmissionPayload,
  createInitialCoachFormState,
  findLegacyTeamSeasonOption,
  validateCoachFormState,
} from "./coachForm.core.mjs";

export function createInitialCoachForm(
  coach,
  coachSeasonalReadModel,
  teamOptions = [],
) {
  return createInitialCoachFormState(
    coach,
    coachSeasonalReadModel,
    teamOptions,
    { placeholderImage: COACH_PLACEHOLDER_IMAGE },
  );
}

export function validateCoachForm(form) {
  return validateCoachFormState(form, REQUIRED_COACH_FIELDS);
}

export function createCoachPayload(form) {
  return createCoachSubmissionPayload(form, {
    createSlug,
    normalizeGermanPhoneNumber,
    placeholderImage: COACH_PLACEHOLDER_IMAGE,
  });
}

export function createCoachAssignment(role = "") {
  return createCoachAssignmentDraft(role);
}

export function getCoachFormBlockingMessage(
  teamOptionsResult,
  coachSeasonalReadModel,
  assignments = [],
) {
  const needsSeasonContext =
    (assignments || []).length > 0 || coachSeasonalReadModel?.legacyFallbackUsed;

  if (
    needsSeasonContext &&
    teamOptionsResult?.activeSeasonStatus === CURRENT_SEASON_STATUSES.MISSING
  ) {
    return "Es ist keine aktuelle Saison markiert. Aktive Trainerzuordnungen koennen derzeit nicht gespeichert werden.";
  }

  if (
    needsSeasonContext &&
    teamOptionsResult?.activeSeasonStatus === CURRENT_SEASON_STATUSES.AMBIGUOUS
  ) {
    return "Es sind mehrere aktuelle Saisons markiert. Aktive Trainerzuordnungen koennen derzeit nicht eindeutig gespeichert werden.";
  }

  return null;
}

export function getCoachFormWarningMessage(
  teamOptionsResult,
  coachSeasonalReadModel,
  teamOptions = [],
) {
  if (coachSeasonalReadModel?.legacyFallbackUsed) {
    const legacyOption = findLegacyTeamSeasonOption(
      coachSeasonalReadModel,
      teamOptions,
    );

    if (legacyOption) {
      return "Die vorausgewaehlte Trainerzuordnung wurde temporaer aus coaches.team_id auf die aktuelle Team-Saison gemappt. Beim Speichern werden die relationalen Saisonzuordnungen kanonisch geschrieben.";
    }

    return "Dieses Trainerprofil nutzt noch Legacy-Snapshots ohne aktive Saisonzuordnung. Bitte pruefe die Zuordnungen vor dem Speichern.";
  }

  if (coachSeasonalReadModel?.legacyRoleFallbackUsed) {
    return "Dieses Trainerprofil nutzt fuer teamlose oder historisierte Zustaende noch eine temporaere Masterrollen-Synchronisierung. Relationale Rollen bleiben fuehrend, sobald aktuelle Saisonzuordnungen vorhanden sind.";
  }

  if (
    teamOptionsResult?.activeSeasonStatus === CURRENT_SEASON_STATUSES.RESOLVED &&
    (teamOptionsResult?.teamOptions || []).length === 0
  ) {
    return "Innerhalb deines Scopes stehen in der aktuellen Saison keine aktiven Mannschaften fuer Trainerzuordnungen zur Verfuegung.";
  }

  return null;
}
