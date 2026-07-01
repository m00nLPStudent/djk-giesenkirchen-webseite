import { uploadMediaFile, deleteMediaFile } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { createEntityRepository } from "@/components/admin/services/entity.repository";

export const TEAM_PLACEHOLDER_IMAGE = "";
export const TEAM_CONTACT_PLACEHOLDER_IMAGE = "";

const teamRepository = createEntityRepository({
  table: "teams",
  placeholderImage: TEAM_PLACEHOLDER_IMAGE,
  imageFields: ["team_image_url", "contact_image_url"],
});

export async function uploadTeamImage(file, team = {}) {
  return await uploadMediaFile(file, {
    folder: "teams",
    name: `${team.name_de || "mannschaft"}-${team.id || Date.now()}`,
    previousUrl: team.team_image_url,
    ignoredUrls: [TEAM_PLACEHOLDER_IMAGE],
  });
}

export async function uploadTeamContactImage(file, team = {}) {
  return await uploadMediaFile(file, {
    folder: "team-contacts",
    name: `${team.contact_name || team.name_de || "kontakt"}-${team.id || Date.now()}`,
    previousUrl: team.contact_image_url,
    ignoredUrls: [TEAM_CONTACT_PLACEHOLDER_IMAGE],
  });
}

export async function deleteTeamImage(imageUrl) {
  return await deleteMediaFile(imageUrl, {
    ignoredUrls: [TEAM_PLACEHOLDER_IMAGE],
  });
}

export async function deleteTeamContactImage(imageUrl) {
  return await deleteMediaFile(imageUrl, {
    ignoredUrls: [TEAM_CONTACT_PLACEHOLDER_IMAGE],
  });
}

function createTeamPayload(team) {
  return {
    name_de: team.name_de || null,
    name_en: team.name_en || null,
    slug: team.slug || null,
    age_group: team.age_group || null,
    season: team.season || null,
    description_de: team.description_de || null,
    description_en: team.description_en || null,
    training_times_de: team.training_times_de || null,
    training_times_en: team.training_times_en || null,
    team_image_url: team.team_image_url || null,
    contact_name: team.contact_name || null,
    contact_email: team.contact_email || null,
    contact_phone: team.contact_phone || null,
    contact_image_url: team.contact_image_url || null,
    fussball_de_matches_widget_id: team.fussball_de_matches_widget_id || null,
    fussball_de_table_widget_id: team.fussball_de_table_widget_id || null,
    sort_order: Number(team.sort_order || 0),
    is_active: team.is_active ?? true,
  };
}

function createTeamSeasonPayload(team, teamId, seasonId) {
  return {
    team_id: teamId,
    season_id: seasonId,
    name_de: team.name_de || null,
    name_en: team.name_en || null,
    slug: team.slug || null,
    age_group: team.age_group || null,
    description_de: team.description_de || null,
    description_en: team.description_en || null,
    training_times_de: team.training_times_de || null,
    training_times_en: team.training_times_en || null,
    team_image_url: team.team_image_url || null,
    contact_name: team.contact_name || null,
    contact_email: team.contact_email || null,
    contact_phone: team.contact_phone || null,
    contact_image_url: team.contact_image_url || null,
    fussball_de_matches_widget_id: team.fussball_de_matches_widget_id || null,
    fussball_de_table_widget_id: team.fussball_de_table_widget_id || null,
    fussball_de_team_url: team.fussball_de_team_url || null,
    sort_order: Number(team.sort_order || 0),
    is_active: team.is_active ?? true,
  };
}

async function replacePlayerAssignments(teamSeasonId, playerIds = []) {
  const deleteResult = await supabase
    .from("player_team_seasons")
    .delete()
    .eq("team_season_id", teamSeasonId);

  if (deleteResult.error) return deleteResult;

  if (!playerIds.length) return { error: null };

  return await supabase.from("player_team_seasons").insert(
    playerIds.map((playerId, index) => ({
      player_id: playerId,
      team_season_id: teamSeasonId,
      sort_order: index,
      is_active: true,
    })),
  );
}

async function replaceCoachAssignments(teamSeasonId, coachIds = []) {
  const deleteResult = await supabase
    .from("coach_team_seasons")
    .delete()
    .eq("team_season_id", teamSeasonId);

  if (deleteResult.error) return deleteResult;

  if (!coachIds.length) return { error: null };

  return await supabase.from("coach_team_seasons").insert(
    coachIds.map((coachId, index) => ({
      coach_id: coachId,
      team_season_id: teamSeasonId,
      sort_order: index,
      is_active: true,
    })),
  );
}

export async function saveTeam(team, id = null) {
  return await teamRepository.upsert(createTeamPayload(team), id);
}

export async function saveTeamWithSeason(team, id = null) {
  const teamResult = await saveTeam(team, id);

  if (teamResult.error) return teamResult;

  const savedTeam = Array.isArray(teamResult.data) ? teamResult.data[0] : teamResult.data;
  const teamId = savedTeam?.id || id;

  if (!teamId || !team.season_id) {
    return teamResult;
  }

  const seasonResult = await supabase
    .from("team_seasons")
    .upsert(createTeamSeasonPayload(team, teamId, team.season_id), {
      onConflict: "team_id,season_id",
    })
    .select("*");

  if (seasonResult.error) return seasonResult;

  const savedTeamSeason = Array.isArray(seasonResult.data)
    ? seasonResult.data[0]
    : seasonResult.data;

  if (savedTeamSeason?.id) {
    const playerResult = await replacePlayerAssignments(
      savedTeamSeason.id,
      team.selected_player_ids || [],
    );

    if (playerResult.error) return playerResult;

    const coachResult = await replaceCoachAssignments(
      savedTeamSeason.id,
      team.selected_coach_ids || [],
    );

    if (coachResult.error) return coachResult;
  }

  return teamResult;
}

export async function removeTeam(team) {
  if (team?.team_image_url) {
    const imageResult = await deleteTeamImage(team.team_image_url);
    if (imageResult?.error) return imageResult;
  }

  if (team?.contact_image_url) {
    const contactImageResult = await deleteTeamContactImage(team.contact_image_url);
    if (contactImageResult?.error) return contactImageResult;
  }

  return await teamRepository.remove(team?.id);
}
