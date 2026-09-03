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
import { loadActiveTeamDepartments } from "@/components/admin/teams/services/teamDepartments.repository";
import { redirect } from "next/navigation";
import { hasManagedDepartmentRouteMismatch } from "@/lib/admin-auth/scopes/departmentManagerScope.core.mjs";

export default async function NewTeamPage({ searchParams, departmentSlug = "fussball" } = {}) {
  const params = await searchParams;
  const requiredDepartmentSlug = departmentSlug || (params?.department === "tischtennis" ? "tischtennis" : null);
  const returnPath = requiredDepartmentSlug ? `/admin/${requiredDepartmentSlug === "fussball" ? "football" : "table-tennis"}/teams` : "/admin/teams";
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
    .select("id, age_group, name_de, department_id");
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

  const { data: departments } = await loadActiveTeamDepartments(supabaseServer);
  const requiredDepartment = requiredDepartmentSlug
    ? (departments || []).find((department) => department.slug === requiredDepartmentSlug)
    : null;
  if (requiredDepartmentSlug && !requiredDepartment?.id) redirect("/admin/unauthorized?reason=missing-department-scope");
  if (hasManagedDepartmentRouteMismatch(scopeContext, requiredDepartment?.id)) redirect("/admin/unauthorized?reason=missing-department-scope");
  const effectiveDepartmentId = requiredDepartment?.id || scopeContext.managedDepartmentId;
  const { data: teamTemplates } = await loadTeamTypes(supabaseServer, { activeOnly: true, departmentId: effectiveDepartmentId || null });
  const scopedDepartments = effectiveDepartmentId
    ? (departments || []).filter((department) => department.id === effectiveDepartmentId)
    : (departments || []);

  const filteredTeamTemplates = canReachTeamCreateOnServer(scopeContext)
    ? (teamTemplates || []).filter((template) => {
        if (scopeContext?.canAccessYouthAll && !scopeContext?.isGlobal) {
          return isYouthTeam(template);
        }

        return !effectiveDepartmentId || template.department_id === effectiveDepartmentId;
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
    loadTeamEditPlayerOptions(supabaseServer, null, effectiveDepartmentId || null),
    coachesQuery,
  ]);

  return (
    <AdminLayout title="Neue Mannschaft" subtitle="Mannschaften" showHeader={false}>
      <AdminModulePage>
      <AdminBackLink href={returnPath}>Zurück zu Mannschaften</AdminBackLink>
      <AdminModuleHeader eyebrow="Mannschaften" title="Neue Mannschaft" description="Mannschaft und Saisonzuordnung anlegen." />
      <TeamScopeGate requireCreateScope>
        <AdminTeamsForm
          team={effectiveDepartmentId ? { department_id: effectiveDepartmentId } : undefined}
          seasons={seasons || []}
          departments={scopedDepartments}
          teamTemplates={filteredTeamTemplates}
          players={players || []}
          coaches={coaches || []}
          returnPath={returnPath}
        />
      </TeamScopeGate>
      </AdminModulePage>
    </AdminLayout>
  );
}
