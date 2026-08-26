export const TEAM_SEASON_YEAR_GROUP_STATUSES = Object.freeze({
  RESOLVED: "TEAM_SEASON_YEAR_GROUPS_RESOLVED",
  NO_MATCH: "TEAM_SEASON_YEAR_GROUPS_NO_MATCH",
  UNMAPPED: "TEAM_SEASON_YEAR_GROUPS_UNMAPPED",
  CURRENT_SEASON_MISSING: "CURRENT_SEASON_MISSING",
  CURRENT_SEASON_AMBIGUOUS: "CURRENT_SEASON_AMBIGUOUS",
});

export function normalizeBirthYears(values = [], { currentYear = new Date().getUTCFullYear() } = {}) {
  const years = Array.from(new Set((values || []).map(Number))).sort((a, b) => a - b);
  if (years.some((year) => !Number.isInteger(year) || year < 1900 || year > currentYear)) {
    return { data: null, error: { code: "INVALID_BIRTH_YEAR", message: `Jahrgaenge muessen zwischen 1900 und ${currentYear} liegen.` } };
  }
  return { data: years, error: null };
}

export function resolveEligibleTeamSeasons({ birthYear, seasonResolution, mappings = [], teamSeasons = [], teams = [] }) {
  if (seasonResolution?.activeSeasonStatus === "CURRENT_SEASON_MISSING") return { status: TEAM_SEASON_YEAR_GROUP_STATUSES.CURRENT_SEASON_MISSING, options: [] };
  if (seasonResolution?.activeSeasonStatus === "CURRENT_SEASON_AMBIGUOUS") return { status: TEAM_SEASON_YEAR_GROUP_STATUSES.CURRENT_SEASON_AMBIGUOUS, options: [] };
  const year = Number(birthYear);
  const mappedIds = new Set(mappings.filter((row) => Number(row.birth_year) === year).map((row) => row.team_season_id));
  if (!mappedIds.size) return { status: TEAM_SEASON_YEAR_GROUP_STATUSES.UNMAPPED, options: [] };
  const teamsById = new Map(teams.map((team) => [team.id, team]));
  const options = teamSeasons.flatMap((row) => {
    const team = teamsById.get(row.team_id);
    if (!mappedIds.has(row.id) || row.season_id !== seasonResolution.activeSeasonId || row.is_active !== true || team?.is_active !== true) return [];
    return [{ teamSeasonId: row.id, teamId: row.team_id, name: row.name_de || team.name_de, slug: row.slug || team.slug || null }];
  });
  return { status: options.length ? TEAM_SEASON_YEAR_GROUP_STATUSES.RESOLVED : TEAM_SEASON_YEAR_GROUP_STATUSES.NO_MATCH, options };
}
