import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminTeamsForm } from "@/components/admin/teams";
import TeamScopeGate from "@/components/admin/teams/components/TeamScopeGate";
import {
  canReachTeamCreateOnServer,
  filterScopedTeamsOnServer,
  loadServerTeamScopeContext,
} from "@/components/admin/teams/serverTeamScope";
import { loadTeamEditPlayerOptions } from "@/components/admin/teams/teamEditPlayer.repository";
import { isYouthTeam } from "@/components/admin/teams/teamScope";
import { AdminBackLink, AdminModuleHeader, AdminModulePage } from "@/components/admin/design-system";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { loadTeamTypes } from "@/components/admin/settings/team-types/teamTypes.repository";
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

  const { data: teamTemplates } = await loadTeamTypes(supabaseServer, { activeOnly: true });

  const filteredTeamTemplates = canReachTeamCreateOnServer(scopeContext)
    ? (teamTemplates || []).filter((template) => {
        if (scopeContext?.canAccessYouthAll && !scopeContext?.isGlobal) {
          return isYouthTeam(template);
        }

        return true;
      })
    : [];

  let coachesQuery = supabaseServer
    .from("coaches")
    .select("*")
    .eq("is_active", true)
    .order("last_name", { ascending: true });

  const coachScopeFilter = scopedTeamIds.length
    ? `team_id.is.null,team_id.in.(${scopedTeamIds.join(",")})`
    : "team_id.is.null";

  coachesQuery = coachesQuery.or(coachScopeFilter);

  const [players, { data: coaches }] = await Promise.all([
    loadTeamEditPlayerOptions(supabaseServer),
    coachesQuery,
  ]);

  return (
    <AdminLayout title="Neue Mannschaft" subtitle="Mannschaften" showHeader={false}>
      <AdminModulePage>
      <AdminBackLink href="/admin/teams">Zurück zu Mannschaften</AdminBackLink>
      <AdminModuleHeader eyebrow="Mannschaften" title="Neue Mannschaft" description="Mannschaft und Saisonzuordnung anlegen." />
      <TeamScopeGate requireCreateScope>
        <AdminTeamsForm
          seasons={seasons || []}
          teamTemplates={filteredTeamTemplates}
          players={players || []}
          coaches={coaches || []}
        />
      </TeamScopeGate>
      </AdminModulePage>
    </AdminLayout>
  );
}
