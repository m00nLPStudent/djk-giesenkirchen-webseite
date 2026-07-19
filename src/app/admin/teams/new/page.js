import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminTeamsForm } from "@/components/admin/teams";
import TeamScopeGate from "@/components/admin/teams/components/TeamScopeGate";
import {
  canReachTeamCreateOnServer,
  filterScopedTeamsOnServer,
  loadServerTeamScopeContext,
} from "@/components/admin/teams/serverTeamScope";
import BackButton from "@/components/admin/ui/BackButton";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { redirect } from "next/navigation";

export default async function NewTeamPage() {
  const permissionResult = await assertAdminActionPermission({
    requiredPermission: "teams.create",
  });

  if (!permissionResult.ok) {
    redirect("/admin/unauthorized?reason=missing-team-permission");
  }

  const scopeContext = await loadServerTeamScopeContext(permissionResult);
  const supabaseServer = permissionResult.supabaseServer;
  if (!canReachTeamCreateOnServer(scopeContext)) {
    redirect("/admin/unauthorized?reason=missing-team-scope");
  }

  const { data: scopedTeamsRaw } = await supabaseServer
    .from("teams")
    .select("id, age_group, name_de");
  const scopedTeams = filterScopedTeamsOnServer(
    scopeContext,
    scopedTeamsRaw || [],
  );
  const scopedTeamIds = scopedTeams.map((team) => team.id);

  const { data: seasons } = await supabaseServer
    .from("seasons")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const { data: teamTemplates } = await supabaseServer
    .from("team_templates")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  let playersQuery = supabaseServer
    .from("players")
    .select("*")
    .eq("is_active", true)
    .order("last_name", { ascending: true });

  let coachesQuery = supabaseServer
    .from("coaches")
    .select("*")
    .eq("is_active", true)
    .order("last_name", { ascending: true });

  const playerScopeFilter = scopedTeamIds.length
    ? `team_id.is.null,team_id.in.(${scopedTeamIds.join(",")})`
    : "team_id.is.null";
  const coachScopeFilter = scopedTeamIds.length
    ? `team_id.is.null,team_id.in.(${scopedTeamIds.join(",")})`
    : "team_id.is.null";

  playersQuery = playersQuery.or(playerScopeFilter);
  coachesQuery = coachesQuery.or(coachScopeFilter);

  const [{ data: players }, { data: coaches }] = await Promise.all([
    playersQuery,
    coachesQuery,
  ]);

  return (
    <AdminLayout title="Neue Mannschaft" subtitle="Mannschaften">
      <BackButton />
      <TeamScopeGate requireCreateScope>
        <AdminTeamsForm
          seasons={seasons || []}
          teamTemplates={teamTemplates || []}
          players={players || []}
          coaches={coaches || []}
        />
      </TeamScopeGate>
    </AdminLayout>
  );
}
