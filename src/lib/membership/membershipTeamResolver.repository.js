import "server-only";
import { FOOTBALL_DEPARTMENT_SLUG } from "./membershipTeamResolver.core.mjs";

export async function loadMembershipTeamResolutionData(db, birthYear) {
  const [seasons, department, mappings] = await Promise.all([
    db.from("seasons").select("id, is_current").eq("is_current", true),
    db.from("departments").select("id, slug, is_active").eq("slug", FOOTBALL_DEPARTMENT_SLUG).eq("is_active", true).maybeSingle(),
    db.from("team_season_year_groups").select("team_season_id, birth_year").eq("birth_year", birthYear),
  ]);
  const firstError = seasons.error || department.error || mappings.error;
  if (firstError) return { data: null, error: firstError };
  const teamSeasonIds = Array.from(new Set((mappings.data || []).map((row) => row.team_season_id).filter(Boolean)));
  if (seasons.data?.length !== 1 || !department.data || !teamSeasonIds.length) return { data: { currentSeasons: seasons.data || [], footballDepartment: department.data || null, mappings: mappings.data || [], teamSeasons: [], teams: [] }, error: null };
  const teamSeasons = await db.from("team_seasons").select("id, team_id, season_id, name_de, age_group, is_active, sort_order").in("id", teamSeasonIds).eq("season_id", seasons.data[0].id).eq("is_active", true).order("sort_order").order("name_de");
  if (teamSeasons.error) return { data: null, error: teamSeasons.error };
  const teamIds = Array.from(new Set((teamSeasons.data || []).map((row) => row.team_id).filter(Boolean)));
  const teams = teamIds.length ? await db.from("teams").select("id, name_de, age_group, department_id, is_active").in("id", teamIds).eq("department_id", department.data.id).eq("is_active", true) : { data: [], error: null };
  if (teams.error) return { data: null, error: teams.error };
  return { data: { currentSeasons: seasons.data || [], footballDepartment: department.data, mappings: mappings.data || [], teamSeasons: teamSeasons.data || [], teams: teams.data || [] }, error: null };
}
