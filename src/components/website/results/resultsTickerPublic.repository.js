import "server-only";

import { loadPublicMediaUrlMap } from "@/components/admin/media-library/media.service";
import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import { createPublicResultDtos } from "./resultsTickerPublic.core.mjs";

const PUBLIC_RESULT_SELECT = "id,competition_label,played_at,club_is_home,opponent_name,club_score,opponent_score,opponent_logo_media_asset_id,is_published,visible_from,visible_until,team_seasons!inner(id,name_de,is_active,sort_order,teams!inner(id,name_de,is_active,sort_order,departments!inner(id,slug,is_active)),seasons!inner(id,is_active))";

export async function loadPublicResultsTicker({ db = createSupabaseAdminClient(), mediaLoader = loadPublicMediaUrlMap, now = new Date() } = {}) {
  if (!db) return { data: [], error: new Error("Public Results Repository ist nicht konfiguriert.") };
  const nowIso = now.toISOString();
  const defaultStartIso = new Date(now.getTime() - 7 * 86400000).toISOString();
  const result = await db.from("club_results")
    .select(PUBLIC_RESULT_SELECT)
    .eq("is_published", true)
    .eq("team_seasons.is_active", true)
    .eq("team_seasons.teams.is_active", true)
    .eq("team_seasons.teams.departments.is_active", true)
    .in("team_seasons.teams.departments.slug", ["fussball", "tischtennis"])
    .eq("team_seasons.seasons.is_active", true)
    .or(`and(visible_from.is.null,visible_until.is.null,played_at.lte.${nowIso},played_at.gt.${defaultStartIso}),and(visible_from.lte.${nowIso},visible_until.gt.${nowIso})`);
  if (result.error) return { data: [], error: result.error };
  const rows = result.data || [];
  const media = await mediaLoader(rows.map((row) => row.opponent_logo_media_asset_id));
  if (media.error) return { data: [], error: media.error };
  return { data: createPublicResultDtos(rows, media.data), error: null };
}
