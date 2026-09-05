import "server-only";

import { loadPublicMediaUrlMap } from "@/components/admin/media-library/media.service";
import { supabase } from "@/lib/supabase";
import {
  TABLE_TENNIS_COMPETITION_STATUS,
  TABLE_TENNIS_DEPARTMENT_SLUG,
  applyPublicMediaUrl,
  mergePublicTableTennisSummaries,
  publicMediaUrlsOrEmpty,
  createPublicTableTennisTeamDto,
  normalizePublicTableTennisTraining,
  normalizePublicTableTennisTeamSlug,
  resolvePublicTableTennisContact,
  resolvePublicTableTennisTeamImage,
  selectCurrentPublicSeason,
  selectPublicTableTennisBoard,
  selectPublicTableTennisCoaches,
  selectPublicTableTennisRoster,
  selectPublicTableTennisTeams,
} from "./tableTennisPublic.core.mjs";

const closed = (error, list = false) => ({ data: list ? [] : null, error: error || new Error("Tischtennisdaten sind nicht verfügbar.") });

export async function resolveActiveTableTennisDepartment(db = supabase) {
  const result = await db.from("departments").select("id, slug, name_de").eq("slug", TABLE_TENNIS_DEPARTMENT_SLUG).eq("is_active", true).maybeSingle();
  if (result.error || !result.data?.id) return closed(result.error);
  return { data: result.data, error: null };
}

async function loadCurrentSeason(db) {
  const result = await db.from("seasons").select("id, name, is_current, is_active, sort_order").eq("is_active", true).order("sort_order", { ascending: true });
  if (result.error) return closed(result.error);
  const season = selectCurrentPublicSeason(result.data || []);
  return season ? { data: season, error: null } : closed(new Error("Keine aktive Saison verfügbar."));
}

async function loadTeamScope(db) {
  const [department, season] = await Promise.all([resolveActiveTableTennisDepartment(db), loadCurrentSeason(db)]);
  if (department.error) return closed(department.error);
  if (season.error) return closed(season.error);
  return { data: { department: department.data, season: season.data }, error: null };
}

export async function loadPublicTableTennisTeams({ db = supabase, mediaLoader = loadPublicMediaUrlMap } = {}) {
  const scope = await loadTeamScope(db);
  if (scope.error) return closed(scope.error, true);
  const { department, season } = scope.data;
  const [teamsResult, teamSeasonsResult] = await Promise.all([
    db.from("teams").select("*").eq("department_id", department.id).eq("is_active", true).order("sort_order", { ascending: true }).order("name_de", { ascending: true }),
    db.from("team_seasons").select("*").eq("season_id", season.id).eq("is_active", true),
  ]);
  if (teamsResult.error || teamSeasonsResult.error) return closed(teamsResult.error || teamSeasonsResult.error, true);
  const rows = selectPublicTableTennisTeams({ teams: teamsResult.data, teamSeasons: teamSeasonsResult.data, departmentId: department.id, season });
  const mediaResult = await mediaLoader(rows.flatMap(({ team, teamSeason }) => [teamSeason.team_image_media_asset_id, team.team_image_media_asset_id]));
  const mediaUrls = publicMediaUrlsOrEmpty(mediaResult);
  return {
    data: rows.map(({ team, teamSeason }) => createPublicTableTennisTeamDto({
      team,
      teamSeason,
      season,
      imageUrl: resolvePublicTableTennisTeamImage({ team, teamSeason, mediaUrls }),
    })),
    error: null,
  };
}

export async function loadPublicTableTennisTeamSummaries(options = {}) {
  const teamsResult = await loadPublicTableTennisTeams(options);
  if (teamsResult.error) return teamsResult;
  const details = await Promise.all(teamsResult.data.map((team) => loadPublicTableTennisTeamBySlug(team.slug, options)));
  return { data: mergePublicTableTennisSummaries(teamsResult.data, details), error: null };
}

export async function loadPublicTableTennisBoard({ db = supabase, mediaLoader = loadPublicMediaUrlMap } = {}) {
  const department = await resolveActiveTableTennisDepartment(db);
  if (department.error) return closed(department.error, true);
  const result = await db.from("board_members").select("*, board_roles(name_de)").eq("organization_scope", "department").eq("department_id", department.data.id).eq("is_active", true).order("sort_order", { ascending: true });
  if (result.error) return closed(result.error, true);
  const board = selectPublicTableTennisBoard(result.data || [], department.data.id);
  const mediaResult = await mediaLoader(board.map((member) => member.imageMediaAssetId));
  const mediaUrls = publicMediaUrlsOrEmpty(mediaResult);
  return { data: board.map((member) => applyPublicMediaUrl(member, mediaUrls)), error: null };
}

export async function loadPublicTableTennisTeamBySlug(slug, { db = supabase, mediaLoader = loadPublicMediaUrlMap, today } = {}) {
  const normalizedSlug = normalizePublicTableTennisTeamSlug(slug);
  if (!normalizedSlug) return closed(new Error("Ungültiger Mannschaftspfad."));
  const scope = await loadTeamScope(db);
  if (scope.error) return closed(scope.error);
  const { department, season } = scope.data;
  const teamResult = await db.from("teams").select("*").eq("slug", normalizedSlug).eq("department_id", department.id).eq("is_active", true).maybeSingle();
  if (teamResult.error || !teamResult.data?.id) return closed(teamResult.error);
  const team = teamResult.data;
  const teamSeasonResult = await db.from("team_seasons").select("*").eq("team_id", team.id).eq("season_id", season.id).eq("is_active", true).maybeSingle();
  if (teamSeasonResult.error || !teamSeasonResult.data?.id) return closed(teamSeasonResult.error);
  const teamSeason = teamSeasonResult.data;

  const [trainingResult, rosterResult, coachesResult] = await Promise.all([
    db.from("team_training_times").select("*").eq("team_season_id", teamSeason.id).eq("is_active", true).order("weekday", { ascending: true }).order("start_time", { ascending: true }),
    db.from("player_team_seasons").select("id, is_active, sort_order, players(id, first_name, last_name, description_de, year_group, strong_hand, image_url, photo_url, image_media_asset_id, is_active, department_id)").eq("team_season_id", teamSeason.id).eq("is_active", true).order("sort_order", { ascending: true }),
    db.from("coach_team_seasons").select("id, role_de, is_active, sort_order, coaches(id, first_name, last_name, name, role, role_de, license, email, phone, whatsapp, image_url, photo_url, image_media_asset_id, is_active, department_id)").eq("team_season_id", teamSeason.id).eq("is_active", true).order("sort_order", { ascending: true }),
  ]);
  const queryError = trainingResult.error || rosterResult.error || coachesResult.error;
  if (queryError) return closed(queryError);

  const training = (trainingResult.data || []).map((item) => normalizePublicTableTennisTraining(item, today)).filter(Boolean);
  const roster = selectPublicTableTennisRoster(rosterResult.data || [], department.id);
  const coaches = selectPublicTableTennisCoaches(coachesResult.data || [], department.id);
  const contact = resolvePublicTableTennisContact({ team: { ...team, ...teamSeason } });
  const mediaIds = [teamSeason.team_image_media_asset_id, team.team_image_media_asset_id, ...roster.map((item) => item.imageMediaAssetId), ...coaches.map((item) => item.imageMediaAssetId), contact?.imageMediaAssetId];
  const mediaResult = await mediaLoader(mediaIds);
  const mediaUrls = publicMediaUrlsOrEmpty(mediaResult);
  const imageUrl = resolvePublicTableTennisTeamImage({ team, teamSeason, mediaUrls });

  return {
    data: {
      team: createPublicTableTennisTeamDto({ team, teamSeason, season, imageUrl }),
      department: { slug: department.slug, name: department.name_de || "Tischtennis" },
      training,
      roster: roster.map((item) => applyPublicMediaUrl(item, mediaUrls)),
      coaches: coaches.map((item) => applyPublicMediaUrl(item, mediaUrls)),
      contact: applyPublicMediaUrl(contact, mediaUrls),
      competition: { status: TABLE_TENNIS_COMPETITION_STATUS },
    },
    error: null,
  };
}
