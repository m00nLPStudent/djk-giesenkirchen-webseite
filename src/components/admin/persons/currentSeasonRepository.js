import "server-only";

import { buildCurrentSeasonResolution } from "./seasonalReadModelCore.mjs";

export async function loadCurrentSeasonResolution(supabaseServer) {
  const { data: seasons, error } = await supabaseServer
    .from("seasons")
    .select("id, name, slug, is_current")
    .eq("is_current", true);

  if (error) {
    throw new Error(
      `seasons query failed in loadCurrentSeasonResolution: ${error.message}`,
    );
  }

  return buildCurrentSeasonResolution(seasons || []);
}
