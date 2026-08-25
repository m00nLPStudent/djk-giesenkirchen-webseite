import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminModuleHeader, AdminModulePage } from "@/components/admin/design-system";
import TeamCreateButton from "@/components/admin/teams/components/TeamCreateButton";
import { FormAlert } from "@/components/admin/forms";
import {
  getContributionStatusVisibility,
} from "@/components/admin/contributions/helpers/contributionStatusScope";
import {
  buildPlayerContributionStatusMap,
  createTeamContributionSummary,
  getContributionSeasonWarning,
} from "@/components/admin/contributions/helpers/contributionStatusSummary";
import {
  loadContributionStatusRowsByPlayerIds,
  loadTeamPlayerAssignmentsBySeason,
} from "@/components/admin/contributions/repositories/contributionStatus.repository";
import { AdminTeamsList } from "@/components/admin/teams";
import TeamsHeaderSearchControls from "@/components/admin/teams/components/TeamsHeaderSearchControls";
import {
  filterScopedTeamsOnServer,
  loadServerTeamScopeContext,
  resolveTeamScopeType,
} from "@/components/admin/teams/serverTeamScope";
import { loadCurrentSeasonResolution } from "@/components/admin/persons/currentSeasonRepository";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import { redirect } from "next/navigation";
import { canManageMedia, loadMediaUrlMap } from "@/components/admin/media-library/media.service";
import { resolveTeamImage } from "@/lib/football/publicTeamImage.core.mjs";

export const dynamic = "force-dynamic";

function matchesTeamSearch(team, search = "") {
  const normalizedSearch = String(search || "").trim().toLowerCase();
  if (!normalizedSearch) return true;

  return [
    team.name_de,
    team.name_en,
    team.age_group,
    team.public_season_name,
    team.training_times_de,
    team.contact_name,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedSearch));
}

function mergeTeamSeason(team, teamSeason, season) {
  const seasonName = season?.name || null;

  if (!teamSeason) {
    return {
      ...team,
      season: seasonName,
      public_season_name: seasonName,
    };
  }

  return {
    ...team,
    ...teamSeason,
    id: team.id,
    is_active: team.is_active,
    team_season_is_active: teamSeason.is_active,
    team_image_media_asset_id: team.team_image_media_asset_id || null,
    season_team_image_media_asset_id: teamSeason.team_image_media_asset_id || null,
    base_slug: team.slug,
    season: seasonName,
    public_season_name: seasonName,
  };
}

export default async function AdminTeamsPage({ searchParams }) {
  const params = await searchParams;
  const teamSearch = String(params?.q || "");
  const teamStatus = ["active", "inactive", "all"].includes(params?.status)
    ? params.status
    : "active";
  const permissionResult = await assertAdminActionPermission({
    requiredPermission: "teams.view",
  });

  if (!permissionResult.ok) {
    redirect("/admin/unauthorized?reason=missing-team-permission");
  }

  const scopeContext = await loadServerTeamScopeContext(permissionResult);
  const scopeType = resolveTeamScopeType(scopeContext);
  const supabaseServer = permissionResult.supabaseServer;

  if (scopeType === "none") {
    return (
      <AdminLayout
        title="Mannschaften verwalten"
        subtitle="Adminbereich"
        showHeader={false}
      >
        <AdminModuleHeader
          eyebrow="Mannschaften"
          title="Mannschaften verwalten"
          description="Teams, Saisonzuordnung und öffentliche Widgets zentral steuern."
        >
          <TeamsHeaderSearchControls searchValue={teamSearch} statusValue={teamStatus} />
        </AdminModuleHeader>

        <AdminTeamsList teams={[]} />
      </AdminLayout>
    );
  }

  let teamsQuery = supabaseServer
    .from("teams")
    .select("*")
    .order("sort_order", { ascending: true });

  if (scopeType === "assigned_teams") {
    const assignedTeamIds = scopeContext?.assignedTeamIds || [];
    if (!assignedTeamIds.length) {
      teamsQuery = null;
    } else {
      teamsQuery = teamsQuery.in("id", assignedTeamIds);
    }
  }

  const { data: teams } = teamsQuery ? await teamsQuery : { data: [] };

  const { data: seasons } = await supabaseServer
    .from("seasons")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const publicSeason =
    (seasons || []).find((season) => season.is_current) || seasons?.[0] || null;

  const scopedTeams = filterScopedTeamsOnServer(scopeContext, teams || []);
  const teamIds = scopedTeams.map((team) => team.id);
  const allowedVisibilities = canManageMedia(permissionResult.roles) ? ["public", "admin"] : ["public"];

  const { data: teamSeasons } = teamIds.length
    ? await supabaseServer
        .from("team_seasons")
        .select("*")
        .in("team_id", teamIds)
        .eq("season_id", publicSeason?.id)
    : { data: [] };

  const teamSeasonIds = (teamSeasons || []).map((teamSeason) => teamSeason.id);
  const teamMediaUrls = await loadMediaUrlMap([
    ...scopedTeams.map((team) => team.team_image_media_asset_id),
    ...(teamSeasons || []).map((teamSeason) => teamSeason.team_image_media_asset_id),
  ], allowedVisibilities);

  const { data: playerAssignments } = teamSeasonIds.length
    ? await supabaseServer
        .from("player_team_seasons")
        .select("id, team_season_id, is_active")
        .in("team_season_id", teamSeasonIds)
    : { data: [] };

  const { data: coachAssignments } = teamSeasonIds.length
    ? await supabaseServer
        .from("coach_team_seasons")
        .select("id, team_season_id, is_active")
        .in("team_season_id", teamSeasonIds)
    : { data: [] };

  const teamList = scopedTeams;
  const teamSeasonList = teamSeasons || [];
  const playerList = playerAssignments || [];
  const coachList = coachAssignments || [];

  const teamsWithCounts = teamList.map((team) => {
    const teamSeason = teamSeasonList.find((item) => item.team_id === team.id);
    const displayTeam = mergeTeamSeason(team, teamSeason, publicSeason);

    return {
      ...displayTeam,
      resolved_team_image_url: resolveTeamImage({
        seasonMediaAssetId: teamSeason?.team_image_media_asset_id,
        seasonLegacyUrl: teamSeason?.team_image_url,
        teamMediaAssetId: team.team_image_media_asset_id,
        teamLegacyUrl: team.team_image_url,
      }, teamMediaUrls.data),
      players_count: playerList.filter(
        (player) =>
          player.team_season_id === teamSeason?.id && player.is_active,
      ).length,
      coaches_count: coachList.filter(
        (coach) => coach.team_season_id === teamSeason?.id && coach.is_active,
      ).length,
    };
  });

  const contributionVisibility = getContributionStatusVisibility(scopeContext);
  const canShowContributionSummary = contributionVisibility !== "none";
  const contributionAdminClient = canShowContributionSummary
    ? createSupabaseAdminClient()
    : null;
  const contributionSeasonResolution = contributionAdminClient
    ? await loadCurrentSeasonResolution(contributionAdminClient)
    : null;
  const contributionSeasonWarning = getContributionSeasonWarning(
    contributionSeasonResolution,
  );
  const contributionAssignments =
    canShowContributionSummary &&
    contributionSeasonResolution?.activeSeasonId
      ? await loadTeamPlayerAssignmentsBySeason(
          supabaseServer,
          teamList.map((team) => team.id),
          contributionSeasonResolution.activeSeasonId,
        )
      : [];
  const playerIdsForContribution = Array.from(
    new Set(
      contributionAssignments.map((assignment) => assignment.player_id).filter(Boolean),
    ),
  );
  const contributionRows =
    contributionAdminClient &&
    contributionSeasonResolution?.activeSeasonId &&
    playerIdsForContribution.length
      ? await loadContributionStatusRowsByPlayerIds(
          contributionAdminClient,
          playerIdsForContribution,
          contributionSeasonResolution.activeSeasonId,
        )
      : [];
  const contributionStatusByPlayerId =
    contributionSeasonResolution?.activeSeasonId
      ? buildPlayerContributionStatusMap(
          playerIdsForContribution,
          contributionSeasonResolution.activeSeasonId,
          contributionRows,
        )
      : new Map();
  const playerIdsByTeamId = contributionAssignments.reduce((map, assignment) => {
    const current = map.get(assignment.team_id) || [];
    current.push(assignment.player_id);
    map.set(assignment.team_id, current);
    return map;
  }, new Map());
  const teamsWithContributionSummary = teamsWithCounts.map((team) => ({
    ...team,
    contributionSummary:
      canShowContributionSummary &&
      contributionSeasonResolution?.activeSeasonId &&
      !contributionSeasonWarning
        ? createTeamContributionSummary(
            team.id,
            contributionSeasonResolution.activeSeasonId,
            playerIdsByTeamId.get(team.id) || [],
            contributionStatusByPlayerId,
          )
        : null,
  }));
  const visibleTeams = teamsWithContributionSummary.filter((team) => {
    const matchesStatus = teamStatus === "all" ||
      (teamStatus === "active" ? team.is_active !== false : team.is_active === false);
    return matchesStatus && matchesTeamSearch(team, teamSearch);
  });

  return (
    <AdminLayout
      title="Mannschaften verwalten"
      subtitle="Adminbereich"
      showHeader={false}
    >
      <AdminModulePage>
      <AdminModuleHeader
        eyebrow="Mannschaften"
        title="Mannschaften verwalten"
        description="Mannschaften, Saisonzuordnungen, Trainer und Spieler verwalten."
        actions={<TeamCreateButton className="rounded-full bg-red-600 px-6 py-2.5 text-sm font-bold transition hover:bg-red-700" label="Neue Mannschaft" />}
      >
        <TeamsHeaderSearchControls searchValue={teamSearch} statusValue={teamStatus} />
      </AdminModuleHeader>

      {contributionSeasonWarning ? (
        <FormAlert className="mb-6 border-amber-400/30 bg-amber-500/10 text-amber-50" tone="warning">
          {contributionSeasonWarning}
        </FormAlert>
      ) : null}

      <AdminTeamsList
        teams={visibleTeams}
        showContributionSummary={
          canShowContributionSummary && !contributionSeasonWarning
        }
      />
      </AdminModulePage>
    </AdminLayout>
  );
}
