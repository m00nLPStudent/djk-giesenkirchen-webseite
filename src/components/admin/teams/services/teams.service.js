import { uploadMediaFile, deleteMediaFile } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { createEntityRepository } from "@/components/admin/services/entity.repository";
import { logAdminSaveEvent } from "@/lib/admin-auth/adminSaveDiagnostics";

export const TEAM_PLACEHOLDER_IMAGE = "";
export const TEAM_CONTACT_PLACEHOLDER_IMAGE = "";

const teamRepository = createEntityRepository({
  table: "teams",
  placeholderImage: TEAM_PLACEHOLDER_IMAGE,
  imageFields: ["team_image_url", "contact_image_url"],
});

function resolveClient(client = null) {
  return client || supabase;
}

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

async function replacePlayerAssignments(
  teamSeasonId,
  playerIds = [],
  client = null,
) {
  const db = resolveClient(client);
  const deleteResult = await db
    .from("player_team_seasons")
    .delete()
    .eq("team_season_id", teamSeasonId);

  if (deleteResult.error) return deleteResult;

  if (!playerIds.length) return { error: null };

  return await db.from("player_team_seasons").insert(
    playerIds.map((playerId, index) => ({
      player_id: playerId,
      team_season_id: teamSeasonId,
      sort_order: index,
      is_active: true,
    })),
  );
}

async function replaceCoachAssignments(
  teamSeasonId,
  coachIds = [],
  client = null,
) {
  const db = resolveClient(client);
  const deleteResult = await db
    .from("coach_team_seasons")
    .delete()
    .eq("team_season_id", teamSeasonId);

  if (deleteResult.error) return deleteResult;

  if (!coachIds.length) return { error: null };

  return await db.from("coach_team_seasons").insert(
    coachIds.map((coachId, index) => ({
      coach_id: coachId,
      team_season_id: teamSeasonId,
      sort_order: index,
      is_active: true,
    })),
  );
}

async function setCurrentPublicSeason(seasonId, client = null) {
  if (!seasonId) return { error: null };

  const db = resolveClient(client);

  const resetResult = await db
    .from("seasons")
    .update({ is_current: false })
    .neq("id", seasonId);

  if (resetResult.error) return resetResult;

  return await db
    .from("seasons")
    .update({ is_current: true })
    .eq("id", seasonId);
}

export async function saveTeam(team, id = null, { client = null } = {}) {
  if (!client) {
    return await teamRepository.upsert(createTeamPayload(team), id);
  }

  const payload = createTeamPayload(team);
  if (id) {
    return await client.from("teams").update(payload).eq("id", id).select("*");
  }

  return await client.from("teams").insert(payload).select("*");
}

export async function saveTeamWithSeason(
  team,
  id = null,
  { client = null } = {},
) {
  const db = resolveClient(client);
  const currentSeasonResult = await setCurrentPublicSeason(
    team.public_season_id,
    db,
  );

  logAdminSaveEvent({
    module: "teams",
    mode: id ? "edit" : "create",
    step: "service.setCurrentPublicSeason",
    operation: "update",
    success: !currentSeasonResult.error,
    error: currentSeasonResult.error,
  });

  if (currentSeasonResult.error) return currentSeasonResult;

  const teamResult = await saveTeam(team, id, { client: db });

  if (teamResult.error) return teamResult;

  const savedTeam = Array.isArray(teamResult.data)
    ? teamResult.data[0]
    : teamResult.data;
  const teamId = savedTeam?.id || id;

  if (!teamId || !team.season_id) {
    return teamResult;
  }

  const seasonResult = await db
    .from("team_seasons")
    .upsert(createTeamSeasonPayload(team, teamId, team.season_id), {
      onConflict: "team_id,season_id",
    })
    .select("*");

  logAdminSaveEvent({
    module: "team_seasons",
    mode: id ? "edit" : "create",
    step: "service.saveTeamWithSeason.teamSeason",
    operation: "upsert",
    success: !seasonResult.error,
    error: seasonResult.error,
    data: seasonResult.data,
  });

  if (seasonResult.error) return seasonResult;

  const savedTeamSeason = Array.isArray(seasonResult.data)
    ? seasonResult.data[0]
    : seasonResult.data;

  if (savedTeamSeason?.id) {
    const playerResult = await replacePlayerAssignments(
      savedTeamSeason.id,
      team.selected_player_ids || [],
      db,
    );

    logAdminSaveEvent({
      module: "player_team_seasons",
      mode: id ? "edit" : "create",
      step: "service.saveTeamWithSeason.players",
      operation: "replace",
      success: !playerResult.error,
      error: playerResult.error,
    });

    if (playerResult.error) return playerResult;

    const coachResult = await replaceCoachAssignments(
      savedTeamSeason.id,
      team.selected_coach_ids || [],
      db,
    );

    logAdminSaveEvent({
      module: "coach_team_seasons",
      mode: id ? "edit" : "create",
      step: "service.saveTeamWithSeason.coaches",
      operation: "replace",
      success: !coachResult.error,
      error: coachResult.error,
    });

    if (coachResult.error) return coachResult;
  }

  return teamResult;
}
