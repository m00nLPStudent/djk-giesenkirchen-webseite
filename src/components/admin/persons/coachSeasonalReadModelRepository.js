import "server-only";

import { loadCurrentSeasonResolution } from "./currentSeasonRepository";
import {
  CURRENT_SEASON_STATUSES,
  buildCoachAssignments,
  createCoachSeasonalReadModel,
  createCoachSeasonalReadModelMap,
  toUniqueIds,
} from "./seasonalReadModelCore.mjs";

async function loadCoachLegacyById(supabaseServer, coachIds = []) {
  const normalizedIds = toUniqueIds(coachIds);
  if (!normalizedIds.length) return new Map();

  const { data, error } = await supabaseServer
    .from("coaches")
    .select("id, team_id, team_name")
    .in("id", normalizedIds);

  if (error) {
    throw new Error(
      `coaches query failed in loadCoachLegacyById: ${error.message}`,
    );
  }

  return new Map((data || []).map((row) => [row.id, row]));
}

async function loadCoachAssignmentsByCoachId(
  supabaseServer,
  coachIds = [],
  seasonResolution,
) {
  if (seasonResolution.activeSeasonStatus !== CURRENT_SEASON_STATUSES.RESOLVED) {
    return new Map();
  }

  const normalizedIds = toUniqueIds(coachIds);
  if (!normalizedIds.length) return new Map();

  const { data: assignments, error: assignmentError } = await supabaseServer
    .from("coach_team_seasons")
    .select(
      "id, coach_id, team_season_id, role_de, role_en, is_active, sort_order, created_at",
    )
    .in("coach_id", normalizedIds)
    .eq("is_active", true);

  if (assignmentError) {
    throw new Error(
      `coach_team_seasons query failed in loadCoachAssignmentsByCoachId: ${assignmentError.message}`,
    );
  }

  const teamSeasonIds = toUniqueIds(
    (assignments || []).map((row) => row?.team_season_id),
  );
  if (!teamSeasonIds.length) return new Map();

  const { data: teamSeasons, error: teamSeasonError } = await supabaseServer
    .from("team_seasons")
    .select("id, team_id, season_id, name_de, name_en, slug, is_active")
    .in("id", teamSeasonIds)
    .eq("is_active", true);

  if (teamSeasonError) {
    throw new Error(
      `team_seasons query failed in loadCoachAssignmentsByCoachId: ${teamSeasonError.message}`,
    );
  }

  const teamIds = toUniqueIds((teamSeasons || []).map((row) => row?.team_id));
  const { data: teams, error: teamError } = await supabaseServer
    .from("teams")
    .select("id, name_de, name_en, slug, is_active")
    .in("id", teamIds)
    .eq("is_active", true);

  if (teamError) {
    throw new Error(
      `teams query failed in loadCoachAssignmentsByCoachId: ${teamError.message}`,
    );
  }

  return buildCoachAssignments({
    assignmentRows: assignments || [],
    teamSeasonsById: new Map((teamSeasons || []).map((row) => [row.id, row])),
    teamsById: new Map((teams || []).map((row) => [row.id, row])),
    activeSeasonId: seasonResolution.activeSeasonId,
    activeSeasonName: seasonResolution.activeSeasonName,
  });
}

export async function getCoachSeasonalReadModelsMap(
  supabaseServer,
  coachIds = [],
) {
  const normalizedIds = toUniqueIds(coachIds);
  const seasonResolution = await loadCurrentSeasonResolution(supabaseServer);
  const legacyById = await loadCoachLegacyById(supabaseServer, normalizedIds);
  const assignmentsByCoachId = await loadCoachAssignmentsByCoachId(
    supabaseServer,
    normalizedIds,
    seasonResolution,
  );

  return createCoachSeasonalReadModelMap({
    coachIds: normalizedIds,
    seasonResolution,
    legacyById,
    assignmentsByCoachId,
  });
}

export async function getCoachSeasonalReadModel(supabaseServer, coachId) {
  const readModels = await getCoachSeasonalReadModelsMap(supabaseServer, [
    coachId,
  ]);

  return (
    readModels.get(coachId) ||
    createCoachSeasonalReadModel({
      coachId,
      seasonResolution: {
        activeSeasonId: null,
        activeSeasonStatus: CURRENT_SEASON_STATUSES.MISSING,
      },
    })
  );
}
