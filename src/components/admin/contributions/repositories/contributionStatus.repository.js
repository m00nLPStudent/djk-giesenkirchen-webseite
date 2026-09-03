import "server-only";

function toUniqueIds(values = []) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

const CONTRIBUTION_STATUS_READ_FIELDS = [
  "id",
  "player_id",
  "season_id",
  "contribution_key",
  "amount_due",
  "amount_paid",
  "amount_waived",
  "status",
  "due_date",
  "deferred_until",
  "canceled_at",
  "created_at",
].join(", ");

export async function loadContributionStatusRowsByPlayerIds(
  db,
  playerIds = [],
  seasonId = null,
) {
  const normalizedIds = toUniqueIds(playerIds);
  if (!db || !normalizedIds.length || !seasonId) {
    return [];
  }

  const { data, error } = await db
    .from("player_contributions")
    .select(CONTRIBUTION_STATUS_READ_FIELDS)
    .eq("season_id", seasonId)
    .in("player_id", normalizedIds);

  if (error) {
    throw new Error(`player_contributions status query failed: ${error.message}`);
  }

  return data || [];
}

export async function loadTeamPlayerAssignmentsBySeason(
  db,
  teamIds = [],
  seasonId = null,
) {
  const normalizedTeamIds = toUniqueIds(teamIds);
  if (!db || !normalizedTeamIds.length || !seasonId) {
    return [];
  }

  const { data: teamSeasons, error: teamSeasonsError } = await db
    .from("team_seasons")
    .select("id, team_id, teams(department_id)")
    .eq("season_id", seasonId)
    .in("team_id", normalizedTeamIds)
    .eq("is_active", true);

  if (teamSeasonsError) {
    throw new Error(`team_seasons query failed: ${teamSeasonsError.message}`);
  }

  const teamSeasonIds = (teamSeasons || []).map((row) => row.id).filter(Boolean);
  if (!teamSeasonIds.length) {
    return [];
  }

  const teamIdByTeamSeasonId = new Map(
    (teamSeasons || []).map((row) => [row.id, row.team_id]),
  );

  const { data: assignments, error: assignmentsError } = await db
    .from("player_team_seasons")
    .select(
      "id, player_id, team_season_id, shirt_number, position_de, position_en, is_captain, sort_order, created_at, players(department_id)",
    )
    .in("team_season_id", teamSeasonIds)
    .eq("is_active", true);

  if (assignmentsError) {
    throw new Error(
      `player_team_seasons query failed: ${assignmentsError.message}`,
    );
  }

  const teamDepartmentBySeasonId = new Map((teamSeasons || []).map((row) => [row.id, (Array.isArray(row.teams) ? row.teams[0] : row.teams)?.department_id || null]));
  return (assignments || []).filter((assignment) => {
    const playerDepartmentId = (Array.isArray(assignment.players) ? assignment.players[0] : assignment.players)?.department_id || null;
    return Boolean(playerDepartmentId) && playerDepartmentId === teamDepartmentBySeasonId.get(assignment.team_season_id);
  }).map((assignment) => ({
    ...assignment,
    team_id: teamIdByTeamSeasonId.get(assignment.team_season_id) || null,
  }));
}
