import "server-only";
import { loadTeamSeasonYearGroups } from "@/components/admin/teams/services/teamSeasonYearGroups.repository";

export async function loadSeasonTeamYearsAdminData(db) {
  const [seasons, teams, teamSeasons] = await Promise.all([
    db.from("seasons").select("id, name, slug, is_current, is_active, sort_order").order("sort_order").order("name"),
    db.from("teams").select("id, name_de, slug, age_group, is_active, department_id, sort_order").order("sort_order").order("name_de"),
    db.from("team_seasons").select("id, team_id, season_id, name_de, slug, age_group, is_active, sort_order").order("sort_order").order("name_de"),
  ]);
  const firstError = seasons.error || teams.error || teamSeasons.error;
  if (firstError) return { data: null, error: firstError };
  const mappings = await loadTeamSeasonYearGroups(db, (teamSeasons.data || []).map((row) => row.id));
  if (mappings.error) return { data: null, error: mappings.error };
  return { data: { seasons: seasons.data || [], teams: teams.data || [], teamSeasons: teamSeasons.data || [], mappings: mappings.data || [] }, error: null };
}
