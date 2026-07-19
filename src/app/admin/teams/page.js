import AdminLayout from "@/components/admin/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import { AdminTeamsList } from "@/components/admin/teams";
import TeamCreateButton from "@/components/admin/teams/components/TeamCreateButton";
import {
  filterScopedTeamsOnServer,
  loadServerTeamScopeContext,
  resolveTeamScopeType,
} from "@/components/admin/teams/serverTeamScope";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function mergeTeamSeason(team, teamSeason, season) {
  if (!teamSeason) {
    return {
      ...team,
      season: season?.name || team.season,
      public_season_name: season?.name || team.season,
    };
  }

  return {
    ...team,
    ...teamSeason,
    id: team.id,
    is_active: team.is_active,
    team_season_is_active: teamSeason.is_active,
    base_slug: team.slug,
    season: season?.name || team.season,
    public_season_name: season?.name || team.season,
  };
}

export default async function AdminTeamsPage() {
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
        <AdminPageHeader
          eyebrow="Mannschaften"
          title="Mannschaften verwalten"
          description="Teams, Saisonzuordnung und öffentliche Widgets zentral steuern."
          actions={
            <TeamCreateButton
              className="rounded-full bg-red-600 px-6 py-3 font-bold transition hover:bg-red-700"
              label="Neue Mannschaft"
            />
          }
        />

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

  const { data: teamSeasons } = teamIds.length
    ? await supabaseServer
        .from("team_seasons")
        .select("*")
        .in("team_id", teamIds)
        .eq("season_id", publicSeason?.id)
    : { data: [] };

  const teamSeasonIds = (teamSeasons || []).map((teamSeason) => teamSeason.id);

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
      players_count: playerList.filter(
        (player) =>
          player.team_season_id === teamSeason?.id && player.is_active,
      ).length,
      coaches_count: coachList.filter(
        (coach) => coach.team_season_id === teamSeason?.id && coach.is_active,
      ).length,
    };
  });

  return (
    <AdminLayout
      title="Mannschaften verwalten"
      subtitle="Adminbereich"
      showHeader={false}
    >
      <AdminPageHeader
        eyebrow="Mannschaften"
        title="Mannschaften verwalten"
        description="Teams, Saisonzuordnung und öffentliche Widgets zentral steuern."
        actions={
          <TeamCreateButton
            className="rounded-full bg-red-600 px-6 py-3 font-bold transition hover:bg-red-700"
            label="Neue Mannschaft"
          />
        }
      />

      <AdminTeamsList teams={teamsWithCounts} />
    </AdminLayout>
  );
}
