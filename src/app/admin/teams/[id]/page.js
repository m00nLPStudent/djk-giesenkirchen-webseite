import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import TeamContributionDetailView from "@/components/admin/teams/components/TeamContributionDetailView";
import {
  canAccessTeamOnServer,
  loadServerTeamScopeContext,
} from "@/components/admin/teams/serverTeamScope";
import { createPlayerReadDto } from "@/components/admin/persons/playerReadDto";
import { getPlayerSeasonalReadModelsMap } from "@/components/admin/persons/playerSeasonalReadModelRepository";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { createSupabaseAdminClient } from "@/lib/supabase.admin";
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
import { loadCurrentSeasonResolution } from "@/components/admin/persons/currentSeasonRepository";

export const dynamic = "force-dynamic";

function comparePlayerRows(a = {}, b = {}) {
  return (
    (a.sortOrder ?? 999) - (b.sortOrder ?? 999) ||
    String(a.displayName || "").localeCompare(String(b.displayName || "")) ||
    String(a.id || "").localeCompare(String(b.id || ""))
  );
}

export default async function AdminTeamDetailPage({ params }) {
  const { id } = await params;
  const permissionResult = await assertAdminActionPermission({
    requiredPermission: "teams.view",
  });

  if (!permissionResult.ok) {
    redirect("/admin/unauthorized?reason=missing-team-permission");
  }

  const scopeContext = await loadServerTeamScopeContext(permissionResult);
  const supabaseServer = permissionResult.supabaseServer;

  const { data: team } = await supabaseServer
    .from("teams")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!team || !canAccessTeamOnServer(scopeContext, team)) {
    redirect("/admin/unauthorized?reason=missing-team-scope");
  }

  const contributionVisibility = getContributionStatusVisibility(scopeContext);
  const contributionAdminClient =
    contributionVisibility !== "none" ? createSupabaseAdminClient() : null;
  const contributionSeasonResolution = contributionAdminClient
    ? await loadCurrentSeasonResolution(contributionAdminClient)
    : null;
  const contributionSeasonWarning = getContributionSeasonWarning(
    contributionSeasonResolution,
  );
  const teamAssignments =
    contributionSeasonResolution?.activeSeasonId
      ? await loadTeamPlayerAssignmentsBySeason(
          supabaseServer,
          [id],
          contributionSeasonResolution.activeSeasonId,
        )
      : [];
  const playerIds = Array.from(
    new Set(teamAssignments.map((assignment) => assignment.player_id).filter(Boolean)),
  );
  const { data: players } = playerIds.length
    ? await supabaseServer
        .from("players")
        .select(
          "id, first_name, last_name, image_url, photo_url, is_active, year_group, strong_foot, nationality, gender, created_at",
        )
        .in("id", playerIds)
    : { data: [] };
  const playerReadModels = playerIds.length
    ? await getPlayerSeasonalReadModelsMap(supabaseServer, playerIds)
    : new Map();
  const contributionRows =
    contributionAdminClient &&
    contributionSeasonResolution?.activeSeasonId &&
    playerIds.length
      ? await loadContributionStatusRowsByPlayerIds(
          contributionAdminClient,
          playerIds,
          contributionSeasonResolution.activeSeasonId,
        )
      : [];
  const contributionStatusByPlayerId =
    contributionSeasonResolution?.activeSeasonId
      ? buildPlayerContributionStatusMap(
          playerIds,
          contributionSeasonResolution.activeSeasonId,
          contributionRows,
        )
      : new Map();
  const assignmentByPlayerId = new Map(
    teamAssignments.map((assignment) => [assignment.player_id, assignment]),
  );
  const playerRows = (players || [])
    .map((player) => {
      const dto = createPlayerReadDto(player, playerReadModels.get(player.id) || {});
      const assignment = assignmentByPlayerId.get(player.id) || {};

      return {
        ...dto,
        sortOrder: assignment.sort_order ?? null,
        assignmentLabel:
          assignment.position_de ||
          assignment.position_en ||
          (assignment.shirt_number ? `Nr. ${assignment.shirt_number}` : "Spieler"),
        contributionStatus: contributionStatusByPlayerId.get(player.id) || null,
      };
    })
    .sort(comparePlayerRows);
  const teamSummary =
    contributionVisibility !== "none" &&
    contributionSeasonResolution?.activeSeasonId &&
    !contributionSeasonWarning
      ? createTeamContributionSummary(
          id,
          contributionSeasonResolution.activeSeasonId,
          playerIds,
          contributionStatusByPlayerId,
        )
      : null;
  const canEdit =
    permissionResult.permissions.includes("teams.edit") &&
    canAccessTeamOnServer(scopeContext, team);
  const canArchive =
    permissionResult.permissions.includes("teams.delete") &&
    canAccessTeamOnServer(scopeContext, team);
  let activeCoachAssignments = 0;
  if (contributionSeasonResolution?.activeSeasonId) {
    const { data: currentTeamSeason } = await supabaseServer
      .from("team_seasons")
      .select("id")
      .eq("team_id", id)
      .eq("season_id", contributionSeasonResolution.activeSeasonId)
      .maybeSingle();
    if (currentTeamSeason?.id) {
      const { count } = await supabaseServer
        .from("coach_team_seasons")
        .select("id", { count: "exact", head: true })
        .eq("team_season_id", currentTeamSeason.id)
        .eq("is_active", true);
      activeCoachAssignments = Number(count || 0);
    }
  }

  return (
    <AdminLayout title="Mannschaftsdetails" subtitle="Mannschaften" showHeader={false}>
      <div className="mx-auto w-full max-w-screen-2xl">
        <TeamContributionDetailView
          team={{
            ...team,
            seasonName: contributionSeasonResolution?.activeSeasonName || null,
            playerCount: playerIds.length,
          }}
          canEdit={canEdit}
          canArchive={canArchive}
          activeCoachAssignments={activeCoachAssignments}
          contributionVisibility={contributionVisibility}
          contributionSeasonWarning={contributionSeasonWarning}
          teamSummary={teamSummary}
          players={playerRows}
        />
      </div>
    </AdminLayout>
  );
}
