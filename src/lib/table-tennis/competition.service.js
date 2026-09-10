import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import { loadClickTtCompetition } from "./clickTt.server";
import { loadCompetitionConfigs } from "./competition.repository";

export async function loadCompetitionFromConfig(config, options) {
  return loadClickTtCompetition(config, options);
}

export async function loadTeamSeasonCompetition(teamSeasonId) {
  const db = createSupabaseAdminClient();
  if (!db) return { status: "unavailable", error: { code: "SERVER_DB_UNAVAILABLE" } };
  const result = await loadCompetitionConfigs(db, [teamSeasonId]);
  if (result.error || !result.data[0]) return { status: "unavailable", error: { code: result.error ? "CONFIG_LOAD_FAILED" : "CONFIG_MISSING" } };
  return loadCompetitionFromConfig(result.data[0]);
}
