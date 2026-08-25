import { supabase } from "@/lib/supabase";
import { loadPublicMediaUrlMap } from "@/components/admin/media-library/media.service";
import { resolvePublicTeamImage } from "./publicTeamImage.core.mjs";

const LEGACY_TEAM_FIELDS =
  "id, slug, name_de, name_en, age_group, training_times_de, team_image_url, is_active, sort_order";
const TEAM_FIELDS = `${LEGACY_TEAM_FIELDS}, team_image_media_asset_id`;
const LEGACY_TEAM_SEASON_FIELDS = "id, team_id, season_id, team_image_url";
const TEAM_SEASON_FIELDS = `${LEGACY_TEAM_SEASON_FIELDS}, team_image_media_asset_id`;

export function getFootballTeamGroup(team = {}) {
  const value =
    `${team.age_group || ""} ${team.name_de || ""} ${team.name_en || ""}`
      .toLowerCase()
      .trim();

  if (/(damen|frauen|women|ladies)/.test(value)) {
    return "damen";
  }

  if (/(senior|herren|men|alte\s*herren)/.test(value)) {
    return "senioren";
  }

  if (/(jugend|bambini|mini|u\s?-?\d{1,2}|[a-f]\s?-?jugend)/.test(value)) {
    return "junioren";
  }

  return "junioren";
}

async function loadActiveFootballTeams(fields) {
  return supabase
    .from("teams")
    .select(fields)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name_de", { ascending: true });
}

export async function getActiveFootballTeams() {
  let result = await loadActiveFootballTeams(TEAM_FIELDS);
  if (result.error?.code === "42703" && result.error.message?.includes("team_image_media_asset_id")) {
    result = await loadActiveFootballTeams(LEGACY_TEAM_FIELDS);
  }
  if (result.error) return result;
  const teams = result.data || [];
  const { data: seasons } = await supabase.from("seasons").select("id, is_current, sort_order").eq("is_active", true).order("sort_order", { ascending: true });
  const seasonId = seasons?.find((season) => season.is_current)?.id || seasons?.[0]?.id || null;
  let teamSeasonsResult = seasonId && teams.length
    ? await supabase.from("team_seasons").select(TEAM_SEASON_FIELDS).eq("season_id", seasonId).in("team_id", teams.map((team) => team.id))
    : { data: [], error: null };
  if (teamSeasonsResult.error?.code === "42703" && teamSeasonsResult.error.message?.includes("team_image_media_asset_id")) {
    teamSeasonsResult = await supabase.from("team_seasons").select(LEGACY_TEAM_SEASON_FIELDS).eq("season_id", seasonId).in("team_id", teams.map((team) => team.id));
  }
  if (teamSeasonsResult.error) return { ...result, error: teamSeasonsResult.error };
  const teamSeasonByTeamId = new Map((teamSeasonsResult.data || []).map((teamSeason) => [teamSeason.team_id, teamSeason]));
  const mediaUrls = await loadPublicMediaUrlMap(teams.flatMap((team) => {
    const teamSeason = teamSeasonByTeamId.get(team.id);
    return [team.team_image_media_asset_id, teamSeason?.team_image_media_asset_id];
  }));
  return { ...result, data: teams.map((team) => {
    const teamSeason = teamSeasonByTeamId.get(team.id);
    return {
      ...team,
      team_season_id: teamSeason?.id || null,
      season_team_image_media_asset_id: teamSeason?.team_image_media_asset_id || null,
      team_image_url: resolvePublicTeamImage({
        seasonMediaAssetId: teamSeason?.team_image_media_asset_id,
        seasonLegacyUrl: teamSeason?.team_image_url,
        teamMediaAssetId: team.team_image_media_asset_id,
        teamLegacyUrl: team.team_image_url,
      }, mediaUrls.data),
    };
  }) };
}

export function groupFootballTeams(teams = []) {
  return (teams || []).reduce(
    (groups, team) => {
      const key = getFootballTeamGroup(team);
      groups[key].push(team);
      return groups;
    },
    { junioren: [], senioren: [], damen: [] },
  );
}
