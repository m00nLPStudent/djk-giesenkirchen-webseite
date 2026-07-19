import {
  findTeamSeason,
  getAssignedIds,
  getCurrentSeason,
} from "./teamFormOptions";

export function createInitialTeamForm({
  team,
  seasons = [],
  teamSeasons = [],
  playerAssignments = [],
  coachAssignments = [],
  seasonId = null,
}) {
  const publicSeason = getCurrentSeason(seasons);
  const selectedSeason =
    seasons.find((season) => season.id === seasonId) || publicSeason;
  const selectedTeamSeason = findTeamSeason(teamSeasons, selectedSeason?.id);
  const source = selectedTeamSeason || team || {};

  return {
    season_id: selectedSeason?.id || "",
    season: selectedSeason?.name || team?.season || "2026/2027",
    public_season_id: publicSeason?.id || selectedSeason?.id || "",
    team_season_id: selectedTeamSeason?.id || "",
    selected_player_ids: getAssignedIds(
      playerAssignments,
      selectedTeamSeason?.id,
      "player_id",
    ),
    selected_coach_ids: getAssignedIds(
      coachAssignments,
      selectedTeamSeason?.id,
      "coach_id",
    ),
    team_template_id: "",
    name_de: source.name_de || team?.name_de || "",
    name_en: source.name_en || team?.name_en || "",
    slug: source.slug || team?.slug || "",
    age_group: source.age_group || team?.age_group || "Jugend",
    description_de: source.description_de || team?.description_de || "",
    description_en: source.description_en || team?.description_en || "",
    training_times_de:
      source.training_times_de || team?.training_times_de || "",
    training_times_en:
      source.training_times_en || team?.training_times_en || "",
    team_image_url: source.team_image_url || team?.team_image_url || "",
    sort_order: source.sort_order ?? team?.sort_order ?? 0,
    is_active: team?.is_active ?? true,
    contact_name: source.contact_name || team?.contact_name || "",
    contact_email: source.contact_email || team?.contact_email || "",
    contact_phone: source.contact_phone || team?.contact_phone || "",
    contact_image_url:
      source.contact_image_url || team?.contact_image_url || "",
    fussball_de_matches_widget_code: "",
    fussball_de_table_widget_code: "",
    fussball_de_matches_widget_id:
      source.fussball_de_matches_widget_id ||
      team?.fussball_de_matches_widget_id ||
      "",
    fussball_de_table_widget_id:
      source.fussball_de_table_widget_id ||
      team?.fussball_de_table_widget_id ||
      "",
    fussball_de_team_url:
      source.fussball_de_team_url || team?.fussball_de_team_url || "",
  };
}
