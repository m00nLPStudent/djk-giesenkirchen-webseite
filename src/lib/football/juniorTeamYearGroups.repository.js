import "server-only";

export async function loadJuniorTeamYearGroups(db, teamSeasonIds = []) {
  const ids = Array.from(new Set(teamSeasonIds.filter(Boolean)));
  if (!db || !ids.length) return { data: [], error: null };

  return db
    .from("team_season_year_groups")
    .select("team_season_id, birth_year")
    .in("team_season_id", ids)
    .order("birth_year", { ascending: true });
}
