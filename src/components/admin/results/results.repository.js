import "server-only";

const RESULT_SELECT = "id,team_season_id,competition_label,played_at,club_is_home,opponent_name,club_score,opponent_score,opponent_logo_media_asset_id,is_published,published_at,visible_from,visible_until,created_by,updated_by,created_at,updated_at,team_seasons(id,name_de,is_active,season_id,teams(id,name_de,is_active,department_id,departments(id,slug,name_de,is_active)),seasons(id,name,is_active)),media_assets(id,storage_bucket,storage_path,display_name,original_filename,media_kind,visibility,purpose,is_archived)";
const TEAM_SEASON_SELECT = "id,name_de,is_active,season_id,teams(id,name_de,is_active,department_id,departments(id,slug,name_de,is_active)),seasons(id,name,is_active)";

export function listResults(db) { return db.from("club_results").select(RESULT_SELECT).order("played_at", { ascending: false }).order("id"); }
export function getResult(db, id) { return db.from("club_results").select(RESULT_SELECT).eq("id", id).maybeSingle(); }
export function listActiveTeamSeasons(db) { return db.from("team_seasons").select(TEAM_SEASON_SELECT).eq("is_active", true).order("id"); }
export function getTeamSeason(db, id) { return db.from("team_seasons").select(TEAM_SEASON_SELECT).eq("id", id).maybeSingle(); }
export function getMediaAsset(db, id) { return db.from("media_assets").select("id,media_kind,visibility,purpose,is_archived").eq("id", id).maybeSingle(); }
export function insertResult(db, payload) { return db.from("club_results").insert(payload).select(RESULT_SELECT).single(); }
export function updateResult(db, id, payload) { return db.from("club_results").update(payload).eq("id", id).select(RESULT_SELECT).maybeSingle(); }
export function deleteResult(db, id) { return db.from("club_results").delete().eq("id", id).select("id").maybeSingle(); }
