import "server-only";

export async function loadTeamSeasonYearGroups(db, teamSeasonIds = []) {
  if (!teamSeasonIds.length) return { data: [], error: null };
  return db.from("team_season_year_groups").select("id, team_season_id, birth_year, created_at").in("team_season_id", teamSeasonIds).order("birth_year");
}

export async function replaceTeamSeasonYearGroups(db, teamSeasonId, birthYears) {
  return db.rpc("replace_team_season_year_groups", {
    target_team_season_id: teamSeasonId,
    target_birth_years: birthYears,
  });
}
