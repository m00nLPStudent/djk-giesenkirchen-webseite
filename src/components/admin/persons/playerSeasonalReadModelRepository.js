import "server-only";

import { loadCurrentSeasonResolution } from "./currentSeasonRepository";
import {
  CURRENT_SEASON_STATUSES,
  buildPlayerAssignments,
  createPlayerSeasonalReadModel,
  createPlayerSeasonalReadModelMap,
  toUniqueIds,
} from "./seasonalReadModelCore.mjs";

async function loadPlayerAssignmentsByPlayerId(
  supabaseServer,
  playerIds = [],
  seasonResolution,
) {
  if (seasonResolution.activeSeasonStatus !== CURRENT_SEASON_STATUSES.RESOLVED) {
    return new Map();
  }

  const normalizedIds = toUniqueIds(playerIds);
  if (!normalizedIds.length) return new Map();

  const { data: assignments, error: assignmentError } = await supabaseServer
    .from("player_team_seasons")
    .select(
      "id, player_id, team_season_id, shirt_number, position_de, position_en, is_captain, is_active, sort_order, created_at",
    )
    .in("player_id", normalizedIds)
    .eq("is_active", true);

  if (assignmentError) {
    throw new Error(
      `player_team_seasons query failed in loadPlayerAssignmentsByPlayerId: ${assignmentError.message}`,
    );
  }

  const teamSeasonIds = toUniqueIds(
    (assignments || []).map((row) => row?.team_season_id),
  );
  if (!teamSeasonIds.length) return new Map();

  const { data: teamSeasons, error: teamSeasonError } = await supabaseServer
    .from("team_seasons")
    .select("id, team_id, season_id, name_de, name_en, slug, age_group, is_active")
    .in("id", teamSeasonIds)
    .eq("is_active", true);

  if (teamSeasonError) {
    throw new Error(
      `team_seasons query failed in loadPlayerAssignmentsByPlayerId: ${teamSeasonError.message}`,
    );
  }

  const teamIds = toUniqueIds((teamSeasons || []).map((row) => row?.team_id));
  const { data: teams, error: teamError } = await supabaseServer
    .from("teams")
    .select("id, name_de, name_en, slug, age_group, department_id, departments(slug, name_de), is_active")
    .in("id", teamIds)
    .eq("is_active", true);

  if (teamError) {
    throw new Error(
      `teams query failed in loadPlayerAssignmentsByPlayerId: ${teamError.message}`,
    );
  }

  return buildPlayerAssignments({
    assignmentRows: assignments || [],
    teamSeasonsById: new Map((teamSeasons || []).map((row) => [row.id, row])),
    teamsById: new Map((teams || []).map((row) => [row.id, row])),
    activeSeasonId: seasonResolution.activeSeasonId,
    activeSeasonName: seasonResolution.activeSeasonName,
  });
}

export async function getPlayerSeasonalReadModelsMap(
  supabaseServer,
  playerIds = [],
) {
  const normalizedIds = toUniqueIds(playerIds);
  const seasonResolution = await loadCurrentSeasonResolution(supabaseServer);
  const assignmentsByPlayerId = await loadPlayerAssignmentsByPlayerId(
    supabaseServer,
    normalizedIds,
    seasonResolution,
  );

  return createPlayerSeasonalReadModelMap({
    playerIds: normalizedIds,
    seasonResolution,
    assignmentsByPlayerId,
  });
}

export async function getPlayerSeasonalReadModel(
  supabaseServer,
  playerId,
) {
  const readModels = await getPlayerSeasonalReadModelsMap(
    supabaseServer,
    [playerId],
  );

  return (
    readModels.get(playerId) ||
    createPlayerSeasonalReadModel({
      playerId,
      seasonResolution: {
        activeSeasonId: null,
        activeSeasonStatus: CURRENT_SEASON_STATUSES.MISSING,
      },
    })
  );
}
