import "server-only";

import { loadCurrentSeasonResolution } from "@/components/admin/persons/currentSeasonRepository";
import { canCreatePlayerOnServer } from "@/components/admin/persons/serverPersonScope";
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
    return "Es ist keine aktuelle Saison markiert. Die Spielerzuordnung kann derzeit nicht gespeichert werden.";
  }

  if (status === CURRENT_SEASON_STATUSES.AMBIGUOUS) {
    return "Es sind mehrere aktuelle Saisons markiert. Die Spielerzuordnung kann derzeit nicht eindeutig aufgeloest werden.";
  }

  return null;
}

export async function loadScopedPlayerTeamSeasonOptions(
  scopeContext,
  supabaseServer,
) {
  const seasonResolution = await loadCurrentSeasonResolution(supabaseServer);

  if (seasonResolution.activeSeasonStatus !== CURRENT_SEASON_STATUSES.RESOLVED) {
    return createStatusResult(
      seasonResolution,
      [],
      getSeasonStatusMessage(seasonResolution.activeSeasonStatus),
    );
  }

  const { data: teamSeasons, error: teamSeasonsError } = await supabaseServer
    .from("team_seasons")
    .select("id, team_id, season_id, name_de, name_en, slug, age_group, is_active, sort_order")
    .eq("season_id", seasonResolution.activeSeasonId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name_de", { ascending: true });

  if (teamSeasonsError) {
    throw new Error(
      `team_seasons query failed in loadScopedPlayerTeamSeasonOptions: ${teamSeasonsError.message}`,
    );
  }

  const teamIds = Array.from(
    new Set((teamSeasons || []).map((row) => row?.team_id).filter(Boolean)),
  );

  const { data: teams, error: teamsError } = await supabaseServer
    .from("teams")
    .select("id, name_de, name_en, slug, age_group, is_active, sort_order")
    .in("id", teamIds)
    .eq("is_active", true);

  if (teamsError) {
    throw new Error(
      `teams query failed in loadScopedPlayerTeamSeasonOptions: ${teamsError.message}`,
    );
  }

  const teamById = new Map((teams || []).map((team) => [team.id, team]));
  const teamOptions = (teamSeasons || [])
    .filter((teamSeason) => teamById.has(teamSeason.team_id))
    .filter((teamSeason) =>
      canCreatePlayerOnServer(
        scopeContext,
        [teamSeason.team_id],
        teamById,
      ),
    )
    .map((teamSeason) => {
      const team = teamById.get(teamSeason.team_id);
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
    });

  return createStatusResult(seasonResolution, teamOptions);
}

export async function resolvePlayerTeamSeasonTarget(supabaseServer, teamSeasonId) {
  const seasonResolution = await loadCurrentSeasonResolution(supabaseServer);

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

  const { data: teamSeason, error: teamSeasonError } = await supabaseServer
    .from("team_seasons")
    .select("id, team_id, season_id, name_de, name_en, slug, age_group, is_active, sort_order")
    .eq("id", teamSeasonId)
    .eq("is_active", true)
    .maybeSingle();

  if (teamSeasonError) {
    throw new Error(
      `team_seasons query failed in resolvePlayerTeamSeasonTarget: ${teamSeasonError.message}`,
    );
  }

  if (!teamSeason || teamSeason.season_id !== seasonResolution.activeSeasonId) {
    return {
      ok: false,
      ...createStatusResult(
        seasonResolution,
        [],
        "Die ausgewaehlte Mannschaft gehoert nicht zur eindeutig aktuellen Saison.",
      ),
    };
  }

  const { data: team, error: teamError } = await supabaseServer
    .from("teams")
    .select("id, name_de, name_en, slug, age_group, is_active, sort_order")
    .eq("id", teamSeason.team_id)
    .eq("is_active", true)
    .maybeSingle();

  if (teamError) {
    throw new Error(
      `teams query failed in resolvePlayerTeamSeasonTarget: ${teamError.message}`,
    );
  }

  if (!team) {
    return {
      ok: false,
      ...createStatusResult(
        seasonResolution,
        [],
        "Die ausgewaehlte Mannschaft ist nicht mehr aktiv.",
      ),
    };
  }

  return {
    ok: true,
    ...createStatusResult(seasonResolution),
    teamSeasonOption: {
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
    },
  };
}
