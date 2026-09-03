import "server-only";

import { loadCurrentSeasonResolution } from "@/components/admin/persons/currentSeasonRepository";
import { sortPlayersByIdentity } from "@/components/admin/players/list/playerList.helpers";
import { createPlayerReadDto } from "@/components/admin/persons/playerReadDto";
import { getPlayerSeasonalReadModelsMap } from "@/components/admin/persons/playerSeasonalReadModelRepository";
import { CURRENT_SEASON_STATUSES } from "@/components/admin/persons/seasonalReadModelCore.mjs";

function uniqueIds(values = []) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

function addToSetMap(map, key, value) {
  if (!key || !value) return;
  const current = map.get(key) || new Set();
  current.add(value);
  map.set(key, current);
}

async function loadActivePlayers(supabaseServer) {
  const { data: players, error } = await supabaseServer
    .from("players")
    .select("id, first_name, last_name, year_group, is_active, image_url, photo_url")
    .eq("is_active", true)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    throw new Error(
      `players query failed in loadTeamEditPlayerOptions: ${error.message}`,
    );
  }

  return players || [];
}

function mapTeamEditPlayers(players = [], readModels = new Map()) {
  return players.map((player) => {
    const dto = createPlayerReadDto(player, readModels.get(player.id) || {});

    return {
      ...player,
      assignments: dto.assignments,
      primaryAssignment: dto.primaryAssignment,
      position_de: dto.positionDe,
      shirt_number: dto.shirtNumber,
      is_captain: dto.isCaptain,
      teamNames: dto.teamNames,
    };
  });
}

async function loadCurrentSeasonTeamIdsByPlayerId(supabaseServer, seasonId) {
  const { data: teamSeasons, error: teamSeasonsError } = await supabaseServer
    .from("team_seasons")
    .select("id, team_id")
    .eq("season_id", seasonId)
    .eq("is_active", true);

  if (teamSeasonsError) {
    throw new Error(
      `team_seasons query failed in loadCurrentSeasonTeamIdsByPlayerId: ${teamSeasonsError.message}`,
    );
  }

  const teamSeasonById = new Map(
    (teamSeasons || []).map((teamSeason) => [teamSeason.id, teamSeason.team_id]),
  );
  const teamSeasonIds = uniqueIds((teamSeasons || []).map((teamSeason) => teamSeason.id));
  if (teamSeasonIds.length === 0) {
    return new Map();
  }

  const { data: assignments, error: assignmentsError } = await supabaseServer
    .from("player_team_seasons")
    .select("player_id, team_season_id")
    .in("team_season_id", teamSeasonIds)
    .eq("is_active", true);

  if (assignmentsError) {
    throw new Error(
      `player_team_seasons query failed in loadCurrentSeasonTeamIdsByPlayerId: ${assignmentsError.message}`,
    );
  }

  const teamIdsByPlayerId = new Map();
  (assignments || []).forEach((assignment) => {
    addToSetMap(
      teamIdsByPlayerId,
      assignment?.player_id,
      teamSeasonById.get(assignment?.team_season_id),
    );
  });

  return new Map(
    [...teamIdsByPlayerId.entries()].map(([playerId, teamIds]) => [
      playerId,
      [...teamIds],
    ]),
  );
}

async function loadPlayerIdsAssignedToTeam(supabaseServer, teamId) {
  if (!teamId) return new Set();

  const { data: teamSeasons, error: teamSeasonsError } = await supabaseServer
    .from("team_seasons")
    .select("id")
    .eq("team_id", teamId);

  if (teamSeasonsError) {
    throw new Error(
      `team_seasons query failed in loadPlayerIdsAssignedToTeam: ${teamSeasonsError.message}`,
    );
  }

  const teamSeasonIds = uniqueIds((teamSeasons || []).map((teamSeason) => teamSeason.id));
  if (teamSeasonIds.length === 0) {
    return new Set();
  }

  const { data: assignments, error: assignmentsError } = await supabaseServer
    .from("player_team_seasons")
    .select("player_id")
    .in("team_season_id", teamSeasonIds);

  if (assignmentsError) {
    throw new Error(
      `player_team_seasons query failed in loadPlayerIdsAssignedToTeam: ${assignmentsError.message}`,
    );
  }

  return new Set((assignments || []).map((assignment) => assignment?.player_id).filter(Boolean));
}

export async function loadTeamEditPlayerOptions(supabaseServer, teamId = null, departmentId = null) {
  const [players, seasonResolution] = await Promise.all([
    loadActivePlayers(supabaseServer),
    loadCurrentSeasonResolution(supabaseServer),
  ]);

  if (seasonResolution.activeSeasonStatus !== CURRENT_SEASON_STATUSES.RESOLVED) {
    return sortPlayersByIdentity(players);
  }

  const playerIds = players.map((player) => player.id).filter(Boolean);
  const playerReadModels = await getPlayerSeasonalReadModelsMap(
    supabaseServer,
    playerIds,
  );
  const mappedPlayers = mapTeamEditPlayers(players, playerReadModels);

  const [currentTeamIdsByPlayerId, assignedToTeamIds] = await Promise.all([
    loadCurrentSeasonTeamIdsByPlayerId(
      supabaseServer,
      seasonResolution.activeSeasonId,
    ),
    loadPlayerIdsAssignedToTeam(supabaseServer, teamId),
  ]);
  const currentTeamIds = uniqueIds([...currentTeamIdsByPlayerId.values()].flat());
  const { data: currentTeams } = currentTeamIds.length ? await supabaseServer.from("teams").select("id, department_id").in("id", currentTeamIds) : { data: [] };
  const departmentByTeamId = new Map((currentTeams || []).map((item) => [item.id, item.department_id]));

  return sortPlayersByIdentity(
    mappedPlayers.filter((player) => {
      const currentTeamIds = currentTeamIdsByPlayerId.get(player.id) || [];

      if (departmentId && !currentTeamIds.some((currentTeamId) => departmentByTeamId.get(currentTeamId) === departmentId)) return false;

      if (currentTeamIds.length === 0) return !departmentId;

      if (!teamId) {
        return false;
      }

      return currentTeamIds.includes(teamId) || assignedToTeamIds.has(player.id);
    }),
  );
}
