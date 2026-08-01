import "server-only";

async function loadCurrentSeasonId(supabaseServer) {
  const { data: seasons } = await supabaseServer
    .from("seasons")
    .select("id, is_current")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const seasonList = seasons || [];
  return (
    seasonList.find((season) => season.is_current)?.id ||
    seasonList[0]?.id ||
    null
  );
}

async function loadActiveTeamMap(supabaseServer, teamIds = []) {
  const uniqueIds = Array.from(new Set((teamIds || []).filter(Boolean)));

  if (!uniqueIds.length) {
    return new Map();
  }

  const { data: teams, error } = await supabaseServer
    .from("teams")
    .select("*")
    .in("id", uniqueIds)
    .eq("is_active", true);

  if (error) {
    throw new Error(
      `teams query failed in loadActiveTeamMap: ${error.message}`,
    );
  }

  return new Map((teams || []).map((team) => [team.id, team]));
}

async function loadEntityTeamIdsBySeasonAssignment({
  supabaseServer,
  table,
  entityIdField,
  entityIds = [],
  activeSeasonId = null,
}) {
  const normalizedIds = Array.from(new Set((entityIds || []).filter(Boolean)));

  const entityTeamIds = new Map(normalizedIds.map((id) => [id, []]));
  if (!normalizedIds.length) {
    return { entityTeamIds, teamById: new Map() };
  }

  const { data: assignments } = await supabaseServer
    .from(table)
    .select(`${entityIdField}, team_season_id, is_active`)
    .in(entityIdField, normalizedIds)
    .eq("is_active", true);

  const assignmentRows = (assignments || []).filter(
    (row) => row?.team_season_id,
  );
  const teamSeasonIds = Array.from(
    new Set(assignmentRows.map((row) => row.team_season_id).filter(Boolean)),
  );

  if (!teamSeasonIds.length) {
    return { entityTeamIds, teamById: new Map() };
  }

  const { data: teamSeasons } = await supabaseServer
    .from("team_seasons")
    .select("id, team_id, season_id, is_active")
    .in("id", teamSeasonIds)
    .eq("is_active", true);

  const validTeamSeasons = (teamSeasons || []).filter((teamSeason) => {
    if (!teamSeason?.id || !teamSeason?.team_id) return false;
    if (!activeSeasonId) return true;
    return teamSeason.season_id === activeSeasonId;
  });

  const teamSeasonById = new Map(
    validTeamSeasons.map((item) => [item.id, item]),
  );
  const teamById = await loadActiveTeamMap(
    supabaseServer,
    validTeamSeasons.map((item) => item.team_id),
  );

  assignmentRows.forEach((assignment) => {
    const teamSeason = teamSeasonById.get(assignment.team_season_id);
    if (!teamSeason || !teamById.has(teamSeason.team_id)) return;

    const current = entityTeamIds.get(assignment[entityIdField]) || [];
    if (!current.includes(teamSeason.team_id)) {
      current.push(teamSeason.team_id);
    }

    entityTeamIds.set(assignment[entityIdField], current);
  });

  return { entityTeamIds, teamById };
}

async function applyLegacyEntityTeamFallback({
  supabaseServer,
  table,
  entityIds = [],
  entityTeamIds,
  teamById,
}) {
  const unresolvedIds = (entityIds || []).filter((entityId) => {
    const ids = entityTeamIds.get(entityId) || [];
    return ids.length === 0;
  });

  if (!unresolvedIds.length) {
    return;
  }

  const { data: entities } = await supabaseServer
    .from(table)
    .select("id, team_id")
    .in("id", unresolvedIds);

  const missingTeamIds = Array.from(
    new Set(
      (entities || [])
        .map((entity) => entity?.team_id)
        .filter((teamId) => teamId && !teamById.has(teamId)),
    ),
  );

  const fallbackTeamMap = await loadActiveTeamMap(
    supabaseServer,
    missingTeamIds,
  );
  fallbackTeamMap.forEach((team, id) => {
    teamById.set(id, team);
  });

  (entities || []).forEach((entity) => {
    if (!entity?.id || !entity?.team_id || !teamById.has(entity.team_id))
      return;
    entityTeamIds.set(entity.id, [entity.team_id]);
  });
}

export async function getPlayerTeamIdsMap(
  supabaseServer,
  playerIds = [],
  { activeSeasonId = null, includeLegacyFallback = true } = {},
) {
  const seasonId =
    activeSeasonId || (await loadCurrentSeasonId(supabaseServer));
  const { entityTeamIds, teamById } = await loadEntityTeamIdsBySeasonAssignment(
    {
      supabaseServer,
      table: "player_team_seasons",
      entityIdField: "player_id",
      entityIds: playerIds,
      activeSeasonId: seasonId,
    },
  );

  if (includeLegacyFallback) {
    await applyLegacyEntityTeamFallback({
      supabaseServer,
      table: "players",
      entityIds: playerIds,
      entityTeamIds,
      teamById,
    });
  }

  return {
    teamIdsByPlayerId: entityTeamIds,
    teamById,
    activeSeasonId: seasonId,
  };
}

export async function getCoachTeamIdsMap(
  supabaseServer,
  coachIds = [],
  { activeSeasonId = null, includeLegacyFallback = true } = {},
) {
  const seasonId =
    activeSeasonId || (await loadCurrentSeasonId(supabaseServer));
  const { entityTeamIds, teamById } = await loadEntityTeamIdsBySeasonAssignment(
    {
      supabaseServer,
      table: "coach_team_seasons",
      entityIdField: "coach_id",
      entityIds: coachIds,
      activeSeasonId: seasonId,
    },
  );

  if (includeLegacyFallback) {
    await applyLegacyEntityTeamFallback({
      supabaseServer,
      table: "coaches",
      entityIds: coachIds,
      entityTeamIds,
      teamById,
    });
  }

  return {
    teamIdsByCoachId: entityTeamIds,
    teamById,
    activeSeasonId: seasonId,
  };
}
