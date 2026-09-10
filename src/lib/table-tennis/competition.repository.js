import "server-only";

const TABLE = "team_season_external_competitions";

export async function loadCompetitionConfigs(db, teamSeasonIds = []) {
  if (!teamSeasonIds.length) return { data: [], error: null };
  const result = await db.from(TABLE).select("team_season_id, provider, association, external_season_key, external_group_id, league_slug, external_team_id, is_active").in("team_season_id", teamSeasonIds);
  return result.error ? { data: [], error: result.error } : { data: result.data || [], error: null };
}

export async function upsertCompetitionConfig(db, teamSeasonId, config) {
  return db.from(TABLE).upsert({ team_season_id: teamSeasonId, ...config }, { onConflict: "team_season_id" }).select("team_season_id, provider, association, external_season_key, external_group_id, league_slug, external_team_id, is_active").single();
}
