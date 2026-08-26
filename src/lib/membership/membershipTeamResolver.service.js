import "server-only";
import { buildMembershipTeamResolution, MEMBERSHIP_TEAM_RESOLUTION, parseMembershipBirthYear } from "./membershipTeamResolver.core.mjs";
import { loadMembershipTeamResolutionData } from "./membershipTeamResolver.repository";

export async function resolveMembershipFootballTeams(birthdate, { client } = {}) {
  const birthYear = parseMembershipBirthYear(birthdate);
  if (!birthYear) return { status: MEMBERSHIP_TEAM_RESOLUTION.INVALID_BIRTHDATE, options: [] };
  if (!client) return { status: MEMBERSHIP_TEAM_RESOLUTION.UNAVAILABLE, options: [] };
  const loaded = await loadMembershipTeamResolutionData(client, birthYear);
  if (loaded.error) return { status: MEMBERSHIP_TEAM_RESOLUTION.UNAVAILABLE, options: [] };
  return buildMembershipTeamResolution({ birthdate, ...loaded.data });
}

export async function resolveMembershipFootballTeamSelection(birthdate, teamSeasonId, { client } = {}) {
  const birthYear = parseMembershipBirthYear(birthdate);
  if (!birthYear || !client || !teamSeasonId) return { data: null, error: null };
  const loaded = await loadMembershipTeamResolutionData(client, birthYear);
  if (loaded.error) return { data: null, error: loaded.error };
  const resolution = buildMembershipTeamResolution({ birthdate, ...loaded.data });
  if (!resolution.options.some((option) => option.teamSeasonId === teamSeasonId)) return { data: null, error: null };
  const teamSeason = loaded.data.teamSeasons.find((row) => row.id === teamSeasonId);
  return teamSeason ? { data: { teamSeasonId: teamSeason.id, teamId: teamSeason.team_id }, error: null } : { data: null, error: null };
}
