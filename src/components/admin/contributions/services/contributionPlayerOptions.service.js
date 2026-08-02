import { buildContributionPlayerOption } from "../helpers/contributionTeamAssignments.js";

function toUniqueIds(values = []) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

function normalizeTeamName(teamSeason = {}, team = {}) {
  return (
    String(teamSeason.name_de || "").trim() ||
    String(team.name_de || "").trim() ||
    "Unbekannte Mannschaft"
  );
}

async function loadPlayerAssignmentRowsDefault(db, playerIds = []) {
  if (!playerIds.length) {
    return [];
  }

  const { data, error } = await db
    .from("player_team_seasons")
    .select("id, player_id, team_season_id, is_active, sort_order, created_at")
    .in("player_id", playerIds)
    .eq("is_active", true);

  if (error) {
    throw new Error(`player_team_seasons query failed: ${error.message}`);
  }

  return data || [];
}

async function loadTeamSeasonRowsDefault(db, teamSeasonIds = []) {
  if (!teamSeasonIds.length) {
    return [];
  }

  const { data, error } = await db
    .from("team_seasons")
    .select("id, team_id, season_id, name_de, is_active, sort_order")
    .in("id", teamSeasonIds)
    .eq("is_active", true);

  if (error) {
    throw new Error(`team_seasons query failed: ${error.message}`);
  }

  return data || [];
}

async function loadTeamRowsDefault(db, teamIds = []) {
  if (!teamIds.length) {
    return [];
  }

  const { data, error } = await db
    .from("teams")
    .select("id, name_de, is_active")
    .in("id", teamIds)
    .eq("is_active", true);

  if (error) {
    throw new Error(`teams query failed: ${error.message}`);
  }

  return data || [];
}

export async function loadContributionPlayerOptions(
  db,
  players = [],
  deps = {},
) {
  const repository = {
    loadPlayerAssignmentRows: loadPlayerAssignmentRowsDefault,
    loadTeamSeasonRows: loadTeamSeasonRowsDefault,
    loadTeamRows: loadTeamRowsDefault,
    ...deps,
  };
  const playerIds = toUniqueIds((players || []).map((player) => player.id));
  const assignmentRows = await repository.loadPlayerAssignmentRows(db, playerIds);
  const teamSeasonRows = await repository.loadTeamSeasonRows(
    db,
    toUniqueIds((assignmentRows || []).map((row) => row.team_season_id)),
  );
  const teamRows = await repository.loadTeamRows(
    db,
    toUniqueIds((teamSeasonRows || []).map((row) => row.team_id)),
  );
  const teamSeasonsById = new Map((teamSeasonRows || []).map((row) => [row.id, row]));
  const teamsById = new Map((teamRows || []).map((row) => [row.id, row]));
  const assignmentsByPlayerId = (assignmentRows || []).reduce((map, row) => {
    const teamSeason = teamSeasonsById.get(row.team_season_id);
    const team = teamsById.get(teamSeason?.team_id);

    if (!row?.player_id || !teamSeason || !team) {
      return map;
    }

    const currentAssignments = map.get(row.player_id) || [];
    currentAssignments.push({
      seasonId: teamSeason.season_id,
      teamSeasonId: teamSeason.id,
      teamId: team.id,
      teamName: normalizeTeamName(teamSeason, team),
      isActive: Boolean(row.is_active),
      sortOrder: row.sort_order ?? teamSeason.sort_order ?? null,
      createdAt: row.created_at ?? null,
    });
    map.set(row.player_id, currentAssignments);
    return map;
  }, new Map());

  return (players || []).map((player) =>
    buildContributionPlayerOption(
      player,
      assignmentsByPlayerId.get(player.id) || [],
    ),
  );
}
