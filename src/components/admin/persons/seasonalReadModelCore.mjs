export const CURRENT_SEASON_STATUSES = {
  RESOLVED: "CURRENT_SEASON_RESOLVED",
  MISSING: "CURRENT_SEASON_MISSING",
  AMBIGUOUS: "CURRENT_SEASON_AMBIGUOUS",
};

export function toUniqueIds(ids = []) {
  return Array.from(new Set((ids || []).filter(Boolean)));
}

function compareNullable(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function compareAssignments(a, b, idKey) {
  return (
    compareNullable(a.sortOrder, b.sortOrder) ||
    compareNullable(a.createdAt, b.createdAt) ||
    compareNullable(a[idKey], b[idKey])
  );
}

function normalizeString(value) {
  return typeof value === "string" && value.trim() ? value : null;
}

function groupByEntity(rows = [], key) {
  return rows.reduce((map, row) => {
    const entityId = row?.[key];
    if (!entityId) return map;
    const current = map.get(entityId) || [];
    current.push(row);
    map.set(entityId, current);
    return map;
  }, new Map());
}

export function buildCurrentSeasonResolution(rows = []) {
  const currentRows = (rows || []).filter((row) => row?.id);

  if (currentRows.length === 1) {
    const season = currentRows[0];
    return {
      activeSeasonId: season.id,
      activeSeasonName: normalizeString(season.name),
      activeSeasonSlug: normalizeString(season.slug),
      activeSeasonStatus: CURRENT_SEASON_STATUSES.RESOLVED,
    };
  }

  return {
    activeSeasonId: null,
    activeSeasonName: null,
    activeSeasonSlug: null,
    activeSeasonStatus:
      currentRows.length === 0
        ? CURRENT_SEASON_STATUSES.MISSING
        : CURRENT_SEASON_STATUSES.AMBIGUOUS,
  };
}

export function buildPlayerAssignments({
  assignmentRows = [],
  teamSeasonsById = new Map(),
  teamsById = new Map(),
  activeSeasonId = null,
  activeSeasonName = null,
}) {
  return groupByEntity(
    (assignmentRows || []).flatMap((row) => {
      const teamSeason = teamSeasonsById.get(row?.team_season_id);
      if (!row?.player_id || !teamSeason || teamSeason.season_id !== activeSeasonId) {
        return [];
      }

      const team = teamsById.get(teamSeason.team_id);
      if (!team) return [];

        return [
        {
          playerId: row.player_id,
          playerTeamSeasonId: row.id,
          teamSeasonId: teamSeason.id,
          teamId: teamSeason.team_id,
          teamNameDe: normalizeString(teamSeason.name_de) || normalizeString(team.name_de),
          teamNameEn: normalizeString(teamSeason.name_en) || normalizeString(team.name_en),
          teamSlug: normalizeString(teamSeason.slug) || normalizeString(team.slug),
          ageGroup: normalizeString(teamSeason.age_group) || normalizeString(team.age_group),
          seasonId: activeSeasonId,
          seasonName: activeSeasonName,
          shirtNumber: row.shirt_number ?? null,
          positionDe: normalizeString(row.position_de),
          positionEn: normalizeString(row.position_en),
          isCaptain: Boolean(row.is_captain),
          isActive: Boolean(row.is_active),
          sortOrder: row.sort_order ?? null,
          createdAt: row.created_at ?? null,
        },
      ];
    }),
    "playerId",
  );
}

export function buildCoachAssignments({
  assignmentRows = [],
  teamSeasonsById = new Map(),
  teamsById = new Map(),
  activeSeasonId = null,
  activeSeasonName = null,
}) {
  return groupByEntity(
    (assignmentRows || []).flatMap((row) => {
      const teamSeason = teamSeasonsById.get(row?.team_season_id);
      if (!row?.coach_id || !teamSeason || teamSeason.season_id !== activeSeasonId) {
        return [];
      }

      const team = teamsById.get(teamSeason.team_id);
      if (!team) return [];

      return [
        {
          coachId: row.coach_id,
          coachTeamSeasonId: row.id,
          teamSeasonId: teamSeason.id,
          teamId: teamSeason.team_id,
          teamNameDe: normalizeString(teamSeason.name_de) || normalizeString(team.name_de),
          teamNameEn: normalizeString(teamSeason.name_en) || normalizeString(team.name_en),
          teamSlug: normalizeString(teamSeason.slug) || normalizeString(team.slug),
          ageGroup: normalizeString(teamSeason.age_group) || normalizeString(team.age_group),
          seasonId: activeSeasonId,
          seasonName: activeSeasonName,
          roleDe: normalizeString(row.role_de),
          roleEn: normalizeString(row.role_en),
          isActive: Boolean(row.is_active),
          sortOrder: row.sort_order ?? null,
          createdAt: row.created_at ?? null,
        },
      ];
    }),
    "coachId",
  );
}

export function createPlayerSeasonalReadModel({
  playerId,
  seasonResolution,
  assignments = [],
}) {
  const sortedAssignments = [...(assignments || [])].sort((a, b) =>
    compareAssignments(a, b, "playerTeamSeasonId"),
  );

  return {
    playerId,
    activeSeasonId: seasonResolution.activeSeasonId,
    activeSeasonStatus: seasonResolution.activeSeasonStatus,
    assignments: sortedAssignments.map(({ createdAt, ...assignment }) => assignment),
    primaryAssignment:
      sortedAssignments.length > 0
        ? (({ createdAt, ...assignment }) => assignment)(sortedAssignments[0])
        : null,
    hasActiveAssignment: sortedAssignments.length > 0,
    hasMultipleActiveAssignments: sortedAssignments.length > 1,
  };
}

export function createCoachSeasonalReadModel({
  coachId,
  seasonResolution,
  legacy = {},
  assignments = [],
}) {
  const sortedAssignments = [...(assignments || [])].sort((a, b) =>
    compareAssignments(a, b, "coachTeamSeasonId"),
  );
  const legacyTeamId = legacy.team_id ?? null;
  const legacyTeamName = normalizeString(legacy.team_name);

  return {
    coachId,
    activeSeasonId: seasonResolution.activeSeasonId,
    activeSeasonStatus: seasonResolution.activeSeasonStatus,
    assignments: sortedAssignments.map(({ createdAt, ...assignment }) => assignment),
    primaryAssignment:
      sortedAssignments.length > 0
        ? (({ createdAt, ...assignment }) => assignment)(sortedAssignments[0])
        : null,
    hasActiveAssignment: sortedAssignments.length > 0,
    hasMultipleActiveAssignments: sortedAssignments.length > 1,
    legacyTeamId,
    legacyTeamName,
    legacyFallbackUsed:
      sortedAssignments.length === 0 &&
      Boolean(legacyTeamId || legacyTeamName),
  };
}

export function createPlayerSeasonalReadModelMap({
  playerIds = [],
  seasonResolution,
  assignmentsByPlayerId = new Map(),
}) {
  return new Map(
    toUniqueIds(playerIds).map((playerId) => [
      playerId,
      createPlayerSeasonalReadModel({
        playerId,
        seasonResolution,
        assignments: assignmentsByPlayerId.get(playerId) || [],
      }),
    ]),
  );
}

export function createCoachSeasonalReadModelMap({
  coachIds = [],
  seasonResolution,
  legacyById = new Map(),
  assignmentsByCoachId = new Map(),
}) {
  return new Map(
    toUniqueIds(coachIds).map((coachId) => [
      coachId,
      createCoachSeasonalReadModel({
        coachId,
        seasonResolution,
        legacy: legacyById.get(coachId) || {},
        assignments: assignmentsByCoachId.get(coachId) || [],
      }),
    ]),
  );
}
