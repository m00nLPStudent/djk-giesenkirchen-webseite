import { getMembershipYearGroup } from "./membershipSubmit.core.mjs";

export const MEMBERSHIP_TEAM_RESOLUTION = Object.freeze({
  INVALID_BIRTHDATE: "invalid_birthdate",
  CURRENT_SEASON_MISSING: "current_season_missing",
  CURRENT_SEASON_AMBIGUOUS: "current_season_ambiguous",
  FOOTBALL_DEPARTMENT_MISSING: "football_department_missing",
  NONE: "none",
  SINGLE: "single",
  MULTIPLE: "multiple",
  UNAVAILABLE: "unavailable",
});

export const FOOTBALL_DEPARTMENT_SLUG = "fussball";

export function parseMembershipBirthYear(birthdate) {
  const year = getMembershipYearGroup(birthdate);
  return year ? Number(year) : null;
}

export function buildMembershipTeamResolution({ birthdate, currentSeasons = [], footballDepartment = null, mappings = [], teamSeasons = [], teams = [] }) {
  const birthYear = parseMembershipBirthYear(birthdate);
  if (!birthYear) return { status: MEMBERSHIP_TEAM_RESOLUTION.INVALID_BIRTHDATE, options: [] };
  if (currentSeasons.length === 0) return { status: MEMBERSHIP_TEAM_RESOLUTION.CURRENT_SEASON_MISSING, options: [] };
  if (currentSeasons.length !== 1) return { status: MEMBERSHIP_TEAM_RESOLUTION.CURRENT_SEASON_AMBIGUOUS, options: [] };
  if (!footballDepartment?.id || footballDepartment.is_active !== true) return { status: MEMBERSHIP_TEAM_RESOLUTION.FOOTBALL_DEPARTMENT_MISSING, options: [] };

  const seasonId = currentSeasons[0].id;
  const mappedIds = new Set(mappings.filter((row) => Number(row.birth_year) === birthYear).map((row) => row.team_season_id));
  const teamsById = new Map(teams.filter((team) => team.is_active === true && team.department_id === footballDepartment.id).map((team) => [team.id, team]));
  const seen = new Set();
  const options = teamSeasons.flatMap((row) => {
    const team = teamsById.get(row.team_id);
    if (!mappedIds.has(row.id) || seen.has(row.id) || row.season_id !== seasonId || row.is_active !== true || !team) return [];
    seen.add(row.id);
    return [{ teamSeasonId: row.id, name: row.name_de || team.name_de || "Mannschaft", ageGroup: row.age_group || team.age_group || null }];
  });
  return { status: options.length === 0 ? MEMBERSHIP_TEAM_RESOLUTION.NONE : options.length === 1 ? MEMBERSHIP_TEAM_RESOLUTION.SINGLE : MEMBERSHIP_TEAM_RESOLUTION.MULTIPLE, options };
}
