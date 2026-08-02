import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminTeamsForm } from "@/components/admin/teams";
import TeamScopeGate from "@/components/admin/teams/components/TeamScopeGate";
import {
  canAccessTeamOnServer,
  loadServerTeamScopeContext,
} from "@/components/admin/teams/serverTeamScope";
import { loadTeamEditCoachData } from "@/components/admin/teams/teamEditCoach.repository";
import { loadTeamEditPlayerOptions } from "@/components/admin/teams/teamEditPlayer.repository";
import { AdminBackLink, AdminModuleHeader, AdminModulePage } from "@/components/admin/design-system";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { redirect } from "next/navigation";

export default async function EditTeamPage({ params }) {
  const { id } = await params;

  const permissionResult = await assertAdminActionPermission({
    requiredPermission: "teams.edit",
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
    .single();

  if (!team || !canAccessTeamOnServer(scopeContext, team)) {
    redirect("/admin/unauthorized?reason=missing-team-scope");
  }

  const { data: seasons } = await supabaseServer
    .from("seasons")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const coachEditData = await loadTeamEditCoachData(supabaseServer, id);
  const teamSeasons = coachEditData.teamSeasons;

  const ids = (teamSeasons || []).map((item) => item.id);

  const { data: playerAssignments } = ids.length
    ? await supabaseServer
        .from("player_team_seasons")
        .select("*")
        .in("team_season_id", ids)
    : { data: [] };

  const players = await loadTeamEditPlayerOptions(supabaseServer, id);

  return (
    <AdminLayout title="Mannschaft bearbeiten" subtitle="Mannschaften" showHeader={false}>
      <AdminModulePage>
      <AdminBackLink href={`/admin/teams/${id}`}>Zurück zu Mannschaftsdetails</AdminBackLink>
      <AdminModuleHeader eyebrow="Mannschaften" title="Mannschaft bearbeiten" description="Mannschaft und Saisonzuordnungen bearbeiten." />
      <TeamScopeGate team={team}>
        <AdminTeamsForm
          team={team}
          seasons={seasons || []}
          teamSeasons={teamSeasons || []}
          players={players || []}
          coaches={coachEditData.coaches || []}
          playerAssignments={playerAssignments || []}
          coachAssignments={coachEditData.coachAssignments || []}
          currentSeasonCoachAssignments={
            coachEditData.currentSeasonCoachAssignments || []
          }
          currentSeasonResolution={coachEditData.currentSeasonResolution}
          currentTeamSeasons={coachEditData.currentTeamSeasons || []}
        />
      </TeamScopeGate>
      </AdminModulePage>
    </AdminLayout>
  );
}
