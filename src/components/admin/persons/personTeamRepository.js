import "server-only";

import {
  getCoachTeamIdsMap as getCoachTeamIdsMapWithLegacyRepository,
} from "./personTeamLegacyRepository";
import { loadCurrentSeasonResolution } from "./currentSeasonRepository";
import { getPlayerSeasonalReadModelsMap } from "./playerSeasonalReadModelRepository";

const COACH_TEAM_ID_LEGACY_FALLBACK_ENABLED = true;

function toUniqueIds(values = []) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

function createSeasonalTeamMapFromAssignments(assignments = [], teamById = new Map()) {
  (assignments || []).forEach((assignment) => {
    if (!assignment?.teamId || teamById.has(assignment.teamId)) return;

    teamById.set(assignment.teamId, {
      id: assignment.teamId,
      name_de: assignment.teamNameDe || assignment.teamNameEn || "Keine Mannschaft",
      name_en: assignment.teamNameEn || assignment.teamNameDe || "No team",
      slug: assignment.teamSlug || null,
      age_group: assignment.ageGroup || null,
      is_active: assignment.isActive !== false,
    });
  });
}

export { loadCurrentSeasonResolution };
export {
  getCoachSeasonalReadModel,
  getCoachSeasonalReadModelsMap,
} from "./coachSeasonalReadModelRepository";
export {
  getPlayerSeasonalReadModel,
  getPlayerSeasonalReadModelsMap,
} from "./playerSeasonalReadModelRepository";

export async function getPlayerTeamIdsMap(
  supabaseServer,
  playerIds = [],
  { activeSeasonId = null } = {},
) {
  const normalizedIds = toUniqueIds(playerIds);
  const seasonResolution =
    normalizedIds.length === 0
      ? await loadCurrentSeasonResolution(supabaseServer)
      : null;
  const readModels = await getPlayerSeasonalReadModelsMap(
    supabaseServer,
    normalizedIds,
  );

  const teamIdsByPlayerId = new Map();
  const teamById = new Map();

  normalizedIds.forEach((playerId) => {
    const readModel = readModels.get(playerId) || {};
    const teamIds = toUniqueIds(
      (readModel.assignments || []).map((assignment) => assignment?.teamId),
    );

    createSeasonalTeamMapFromAssignments(readModel.assignments, teamById);
    teamIdsByPlayerId.set(playerId, teamIds);
  });

  const firstReadModel = normalizedIds.length
    ? readModels.get(normalizedIds[0]) || null
    : null;
  const resolvedSeasonId =
    activeSeasonId ||
    firstReadModel?.activeSeasonId ||
    seasonResolution?.activeSeasonId ||
    null;

  return {
    teamIdsByPlayerId,
    teamById,
    activeSeasonId: resolvedSeasonId,
  };
}

export async function getCoachTeamIdsMap(
  supabaseServer,
  coachIds = [],
  {
    activeSeasonId = null,
    includeLegacyFallback = COACH_TEAM_ID_LEGACY_FALLBACK_ENABLED,
  } = {},
) {
  return await getCoachTeamIdsMapWithLegacyRepository(
    supabaseServer,
    coachIds,
    {
      activeSeasonId,
      includeLegacyFallback,
    },
  );
}
