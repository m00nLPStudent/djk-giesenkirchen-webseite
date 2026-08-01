import "server-only";

import { loadCurrentSeasonResolution } from "@/components/admin/persons/currentSeasonRepository";

export async function loadTeamEditCoachData(supabaseServer, teamId) {
  const currentSeasonResolution = await loadCurrentSeasonResolution(
    supabaseServer,
  );

  const { data: teamSeasons, error: teamSeasonsError } = await supabaseServer
    .from("team_seasons")
    .select("id, team_id, season_id, name_de, name_en, slug, age_group, is_active")
    .eq("team_id", teamId);

  if (teamSeasonsError) {
    throw new Error(
      `team_seasons query failed in loadTeamEditCoachData: ${teamSeasonsError.message}`,
    );
  }

  const teamSeasonIds = (teamSeasons || []).map((item) => item.id).filter(Boolean);
  const currentTeamSeasons = (teamSeasons || []).filter(
    (item) =>
      item.season_id === currentSeasonResolution.activeSeasonId &&
      item.is_active !== false,
  );

  const { data: coachAssignments, error: coachAssignmentsError } = teamSeasonIds.length
    ? await supabaseServer
        .from("coach_team_seasons")
        .select("id, coach_id, team_season_id, role_de, role_en, sort_order, is_active, created_at")
        .in("team_season_id", teamSeasonIds)
    : { data: [], error: null };

  if (coachAssignmentsError) {
    throw new Error(
      `coach_team_seasons query failed in loadTeamEditCoachData: ${coachAssignmentsError.message}`,
    );
  }

  const { data: coaches, error: coachesError } = await supabaseServer
    .from("coaches")
    .select("id, first_name, last_name, name, slug, role, role_de, role_en, email, nationality, image_url, photo_url, license, sort_order, is_active")
    .eq("is_active", true)
    .order("last_name", { ascending: true });

  if (coachesError) {
    throw new Error(
      `coaches query failed in loadTeamEditCoachData: ${coachesError.message}`,
    );
  }

  const coachIds = (coaches || []).map((coach) => coach.id).filter(Boolean);
  const { data: currentSeasonTeamSeasons, error: currentSeasonTeamSeasonsError } =
    currentSeasonResolution.activeSeasonId
      ? await supabaseServer
          .from("team_seasons")
          .select("id, team_id, season_id")
          .eq("season_id", currentSeasonResolution.activeSeasonId)
          .eq("is_active", true)
      : { data: [], error: null };

  if (currentSeasonTeamSeasonsError) {
    throw new Error(
      `team_seasons current-season query failed in loadTeamEditCoachData: ${currentSeasonTeamSeasonsError.message}`,
    );
  }

  const currentSeasonTeamSeasonIds = (currentSeasonTeamSeasons || [])
    .map((item) => item.id)
    .filter(Boolean);
  const { data: currentSeasonCoachAssignments, error: currentSeasonAssignmentsError } =
    coachIds.length && currentSeasonTeamSeasonIds.length
      ? await supabaseServer
          .from("coach_team_seasons")
          .select("id, coach_id, team_season_id, role_de, role_en, sort_order, is_active, created_at")
          .in("coach_id", coachIds)
          .in("team_season_id", currentSeasonTeamSeasonIds)
          .eq("is_active", true)
      : { data: [], error: null };

  if (currentSeasonAssignmentsError) {
    throw new Error(
      `coach_team_seasons current-season query failed in loadTeamEditCoachData: ${currentSeasonAssignmentsError.message}`,
    );
  }

  return {
    coaches: coaches || [],
    coachAssignments: coachAssignments || [],
    currentSeasonCoachAssignments: currentSeasonCoachAssignments || [],
    currentSeasonResolution,
    currentTeamSeasons,
    teamSeasons: teamSeasons || [],
  };
}
