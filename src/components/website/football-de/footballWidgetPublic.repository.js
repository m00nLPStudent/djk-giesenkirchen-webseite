import "server-only";

import { supabase } from "@/lib/supabase";
import { selectConfiguredFootballWidgetTeams } from "./footballWidgetPublic.core.mjs";

export async function loadPublicFootballWidgetTeams({ db = supabase } = {}) {
  const [departmentResult, seasonsResult] = await Promise.all([
    db.from("departments").select("id").eq("slug", "fussball").eq("is_active", true).maybeSingle(),
    db.from("seasons").select("id, is_current, sort_order").eq("is_active", true).order("sort_order", { ascending: true }),
  ]);
  const department = departmentResult.data;
  const seasons = seasonsResult.data || [];
  const season = seasons.find((item) => item.is_current) || seasons[0] || null;
  if (departmentResult.error || seasonsResult.error || !department?.id || !season?.id) {
    return { data: [], error: departmentResult.error || seasonsResult.error || new Error("Kein aktiver Fußball-Spielbetrieb verfügbar.") };
  }

  const [teamsResult, teamSeasonsResult] = await Promise.all([
    db.from("teams").select("id, slug, name_de, sort_order, department_id, is_active").eq("department_id", department.id).eq("is_active", true),
    db.from("team_seasons").select("team_id, season_id, name_de, is_active, fussball_de_matches_widget_id, fussball_de_table_widget_id").eq("season_id", season.id).eq("is_active", true),
  ]);
  const error = teamsResult.error || teamSeasonsResult.error;
  if (error) return { data: [], error };
  return {
    data: selectConfiguredFootballWidgetTeams({ teams: teamsResult.data, teamSeasons: teamSeasonsResult.data, departmentId: department.id, seasonId: season.id }),
    error: null,
  };
}
