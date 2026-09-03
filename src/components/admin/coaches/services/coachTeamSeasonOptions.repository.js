import "server-only";

import { loadCurrentSeasonResolution } from "@/components/admin/persons/currentSeasonRepository";
import { loadScopedActiveTeamsForPeople } from "@/components/admin/persons/serverPersonScope";
import { CURRENT_SEASON_STATUSES } from "@/components/admin/persons/seasonalReadModelCore.mjs";

function createStatusResult(seasonResolution, teamOptions = [], message = null) {
  return {
    activeSeasonId: seasonResolution.activeSeasonId,
    activeSeasonName: seasonResolution.activeSeasonName,
    activeSeasonStatus: seasonResolution.activeSeasonStatus,
    teamOptions,
    message,
  };
}

function getSeasonStatusMessage(status) {
  if (status === CURRENT_SEASON_STATUSES.MISSING) {
    return "Es ist keine aktuelle Saison markiert. Die Trainerzuordnung kann derzeit nicht gespeichert werden.";
  }

  if (status === CURRENT_SEASON_STATUSES.AMBIGUOUS) {
    return "Es sind mehrere aktuelle Saisons markiert. Die Trainerzuordnung kann derzeit nicht eindeutig aufgeloest werden.";
  }

  return null;
}

function mapTeamSeasonOption(teamSeason, team, seasonResolution) {
  return {
    teamSeasonId: teamSeason.id,
    teamId: team.id,
    teamNameDe: teamSeason.name_de || team.name_de || "",
    teamNameEn: teamSeason.name_en || team.name_en || "",
    teamSlug: teamSeason.slug || team.slug || "",
    seasonId: seasonResolution.activeSeasonId,
    seasonName: seasonResolution.activeSeasonName,
    ageGroup: teamSeason.age_group || team.age_group || "",
    isActive: teamSeason.is_active !== false,
    sortOrder: teamSeason.sort_order ?? team.sort_order ?? 0,
    team,
  };
}

export async function loadScopedCoachTeamSeasonOptions(
  scopeContext,
  supabaseServer,
  { requiredDepartmentId = null } = {},
) {
  const seasonResolution = await loadCurrentSeasonResolution(supabaseServer);

  if (seasonResolution.activeSeasonStatus !== CURRENT_SEASON_STATUSES.RESOLVED) {
    return createStatusResult(
      seasonResolution,
      [],
      getSeasonStatusMessage(seasonResolution.activeSeasonStatus),
    );
  }

  const allowedTeams = await loadScopedActiveTeamsForPeople(
    scopeContext,
    supabaseServer,
  );
  const filteredTeams = requiredDepartmentId ? (allowedTeams || []).filter((team) => team.department_id === requiredDepartmentId) : (allowedTeams || []);
  const allowedTeamIds = new Set(filteredTeams.map((team) => team.id));

  const { data: teamSeasons, error } = await supabaseServer
    .from("team_seasons")
    .select("id, team_id, season_id, name_de, name_en, slug, age_group, is_active, sort_order")
    .eq("season_id", seasonResolution.activeSeasonId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name_de", { ascending: true });

  if (error) {
    throw new Error(
      `team_seasons query failed in loadScopedCoachTeamSeasonOptions: ${error.message}`,
    );
  }

  const teamSeasonsInScope = (teamSeasons || []).filter((teamSeason) =>
    allowedTeamIds.has(teamSeason.team_id),
  );
  const teamById = new Map(filteredTeams.map((team) => [team.id, team]));

  return createStatusResult(
    seasonResolution,
    teamSeasonsInScope
      .filter((teamSeason) => teamById.has(teamSeason.team_id))
      .map((teamSeason) =>
        mapTeamSeasonOption(
          teamSeason,
          teamById.get(teamSeason.team_id),
          seasonResolution,
        ),
      ),
  );
}

export async function resolveCoachTeamSeasonTargets(
  supabaseServer,
  assignments = [],
) {
  const seasonResolution = await loadCurrentSeasonResolution(supabaseServer);
  const uniqueTeamSeasonIds = Array.from(
    new Set((assignments || []).map((item) => item?.team_season_id).filter(Boolean)),
  );

  if (!uniqueTeamSeasonIds.length) {
    return {
      ok: true,
      ...createStatusResult(
        seasonResolution,
        [],
        getSeasonStatusMessage(seasonResolution.activeSeasonStatus),
      ),
      teamSeasonOptions: [],
    };
  }

  if (seasonResolution.activeSeasonStatus !== CURRENT_SEASON_STATUSES.RESOLVED) {
    return {
      ok: false,
      ...createStatusResult(
        seasonResolution,
        [],
        getSeasonStatusMessage(seasonResolution.activeSeasonStatus),
      ),
    };
  }

  const { data: teamSeasons, error: teamSeasonsError } = await supabaseServer
    .from("team_seasons")
    .select("id, team_id, season_id, name_de, name_en, slug, age_group, is_active, sort_order")
    .in("id", uniqueTeamSeasonIds)
    .eq("is_active", true);

  if (teamSeasonsError) {
    throw new Error(
      `team_seasons query failed in resolveCoachTeamSeasonTargets: ${teamSeasonsError.message}`,
    );
  }

  if ((teamSeasons || []).length !== uniqueTeamSeasonIds.length) {
    return {
      ok: false,
      ...createStatusResult(
        seasonResolution,
        [],
        "Mindestens eine ausgewaehlte Mannschaft ist ungueltig oder nicht mehr aktiv.",
      ),
    };
  }

  const invalidSeasonTarget = (teamSeasons || []).find(
    (teamSeason) => teamSeason.season_id !== seasonResolution.activeSeasonId,
  );
  if (invalidSeasonTarget) {
    return {
      ok: false,
      ...createStatusResult(
        seasonResolution,
        [],
        "Mindestens eine ausgewaehlte Mannschaft gehoert nicht zur eindeutig aktuellen Saison.",
      ),
    };
  }

  const teamIds = Array.from(
    new Set((teamSeasons || []).map((teamSeason) => teamSeason.team_id).filter(Boolean)),
  );
  const { data: teams, error: teamsError } = await supabaseServer
    .from("teams")
    .select("id, name_de, name_en, slug, age_group, department_id, departments(slug), is_active, sort_order")
    .in("id", teamIds)
    .eq("is_active", true);

  if (teamsError) {
    throw new Error(
      `teams query failed in resolveCoachTeamSeasonTargets: ${teamsError.message}`,
    );
  }

  const teamById = new Map((teams || []).map((team) => [team.id, team]));
  const teamSeasonOptions = (teamSeasons || []).map((teamSeason) => {
    const team = teamById.get(teamSeason.team_id);
    if (!team) return null;
    return mapTeamSeasonOption(teamSeason, team, seasonResolution);
  });

  if (teamSeasonOptions.some((item) => !item)) {
    return {
      ok: false,
      ...createStatusResult(
        seasonResolution,
        [],
        "Mindestens eine ausgewaehlte Mannschaft ist nicht mehr aktiv.",
      ),
    };
  }

  return {
    ok: true,
    ...createStatusResult(seasonResolution),
    teamSeasonOptions,
  };
}
