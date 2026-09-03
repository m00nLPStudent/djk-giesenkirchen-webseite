import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminPlayersForm } from "@/components/admin/players";
import { AdminBackLink, AdminModuleHeader, AdminModulePage } from "@/components/admin/design-system";
import { redirect } from "next/navigation";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import {
  loadServerPersonScopeContext,
} from "@/components/admin/persons/serverPersonScope";
import { CURRENT_SEASON_STATUSES } from "@/components/admin/persons/seasonalReadModelCore.mjs";
import { loadScopedPlayerTeamSeasonOptions } from "@/components/admin/players/services/playerTeamSeasonOptions.repository";
import { hasManagedDepartmentRouteMismatch } from "@/lib/admin-auth/scopes/departmentManagerScope.core.mjs";

export const dynamic = "force-dynamic";

export default async function NewPlayerPage({ searchParams, departmentSlug = "fussball" }) {
  const params = await searchParams;
  const permissionResult = await assertAdminActionPermission({
    requiredPermission: "players.create",
  });

  if (!permissionResult.ok) {
    redirect("/admin/unauthorized?reason=missing-player-permission");
  }

  const scopeContext = await loadServerPersonScopeContext(permissionResult);
  const requestedDepartmentSlug = departmentSlug || (params?.department === "tischtennis" ? "tischtennis" : null);
  const { data: requiredDepartment } = requestedDepartmentSlug ? await permissionResult.supabaseServer.from("departments").select("id").eq("slug", requestedDepartmentSlug).eq("is_active", true).maybeSingle() : { data: null };
  if (requestedDepartmentSlug && !requiredDepartment?.id) redirect("/admin/unauthorized?reason=missing-department-scope");
  if (hasManagedDepartmentRouteMismatch(scopeContext, requiredDepartment?.id)) redirect("/admin/unauthorized?reason=missing-department-scope");
  const teamOptionsResult = await loadScopedPlayerTeamSeasonOptions(
    scopeContext,
    permissionResult.supabaseServer,
    { requiredDepartmentId: requiredDepartment?.id || null },
  );

  if (
    teamOptionsResult.activeSeasonStatus ===
      CURRENT_SEASON_STATUSES.RESOLVED &&
    teamOptionsResult.teamOptions.length === 0
  ) {
    redirect("/admin/unauthorized?reason=missing-player-scope");
  }

  return (
    <AdminLayout title="Neuer Spieler" subtitle="Spieler" showHeader={false}>
      <AdminModulePage>
        <AdminBackLink href={requestedDepartmentSlug ? `/admin/${requestedDepartmentSlug === "fussball" ? "football" : "table-tennis"}/players` : "/admin/players"}>Zurück zu Spielern</AdminBackLink>
        <AdminModuleHeader eyebrow="Spieler" title="Neuer Spieler" description="Spielerprofil und Mannschaftszuordnung anlegen." />
        <AdminPlayersForm teamOptionsResult={teamOptionsResult} sportContext={requestedDepartmentSlug === "tischtennis" ? "table_tennis" : "football"} returnPath={requestedDepartmentSlug ? `/admin/${requestedDepartmentSlug === "fussball" ? "football" : "table-tennis"}/players` : "/admin/players"} />
      </AdminModulePage>
    </AdminLayout>
  );
}
