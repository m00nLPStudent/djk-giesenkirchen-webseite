import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminTeamsForm } from "@/components/admin/teams";
import TeamScopeGate from "@/components/admin/teams/components/TeamScopeGate";
import {
  canAccessTeamOnServer,
  loadServerTeamScopeContext,
} from "@/components/admin/teams/serverTeamScope";
import BackButton from "@/components/admin/ui/BackButton";
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

  const { data: team } = await supabaseServer.from("teams").select("*").eq("id", id).single();

  if (!team || !canAccessTeamOnServer(scopeContext, team)) {
    redirect("/admin/unauthorized?reason=missing-team-scope");
  }

  const { data: seasons } = await supabaseServer
    .from("seasons")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const { data: teamSeasons } = await supabaseServer
    .from("team_seasons")
    .select("*")
    .eq("team_id", id);

  const ids = (teamSeasons || []).map((item) => item.id);

  const { data: playerAssignments } = ids.length
    ? await supabaseServer.from("player_team_seasons").select("*").in("team_season_id", ids)
    : { data: [] };

  const { data: coachAssignments } = ids.length
    ? await supabaseServer.from("coach_team_seasons").select("*").in("team_season_id", ids)
    : { data: [] };

  const { data: players } = await supabaseServer
    .from("players")
    .select("*")
    .eq("is_active", true)
    .or(`team_id.is.null,team_id.eq.${id}`)
    .order("last_name", { ascending: true });

  const { data: coaches } = await supabaseServer
    .from("coaches")
    .select("*")
    .eq("is_active", true)
    .or(`team_id.is.null,team_id.eq.${id}`)
    .order("last_name", { ascending: true });

  return (
    <AdminLayout title="Mannschaft bearbeiten" subtitle="Mannschaften">
      <BackButton />
      <TeamScopeGate team={team}>
        <AdminTeamsForm
          team={team}
          seasons={seasons || []}
          teamSeasons={teamSeasons || []}
          players={players || []}
          coaches={coaches || []}
          playerAssignments={playerAssignments || []}
          coachAssignments={coachAssignments || []}
        />
      </TeamScopeGate>
    </AdminLayout>
  );
}
