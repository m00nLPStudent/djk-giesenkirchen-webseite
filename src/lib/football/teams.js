import { supabase } from "@/lib/supabase";
import { loadPublicMediaUrlMap } from "@/components/admin/media-library/media.service";
import { resolvePublicTeamImage } from "./publicTeamImage.core.mjs";

const LEGACY_TEAM_FIELDS =
  "id, slug, name_de, name_en, age_group, training_times_de, team_image_url, is_active, sort_order";
const TEAM_FIELDS = `${LEGACY_TEAM_FIELDS}, team_image_media_asset_id`;

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
  const mediaUrls = await loadPublicMediaUrlMap(teams.map((team) => team.team_image_media_asset_id));
  return { ...result, data: teams.map((team) => ({ ...team, team_image_url: resolvePublicTeamImage({ mediaAssetId: team.team_image_media_asset_id, teamLegacyUrl: team.team_image_url }, mediaUrls.data) })) };
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
