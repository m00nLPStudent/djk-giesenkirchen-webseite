import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminCoachesForm } from "@/components/admin/coaches";
import BackButton from "@/components/admin/ui/BackButton";
import { redirect } from "next/navigation";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import {
  canCreateCoachOnServer,
  loadServerPersonScopeContext,
} from "@/components/admin/persons/serverPersonScope";
import { loadScopedCoachTeamSeasonOptions } from "@/components/admin/coaches/services/coachTeamSeasonOptions.repository";
import { hasManagedDepartmentRouteMismatch } from "@/lib/admin-auth/scopes/departmentManagerScope.core.mjs";

export const dynamic = "force-dynamic";

export default async function NewCoachPage({ searchParams, departmentSlug = "fussball" }) {
  const params = await searchParams;
  const permissionResult = await assertAdminActionPermission({
    requiredPermission: "coaches.create",
  });

  if (!permissionResult.ok) {
    redirect("/admin/unauthorized?reason=missing-coach-permission");
  }

  const scopeContext = await loadServerPersonScopeContext(permissionResult);
  const requestedDepartmentSlug = departmentSlug || (params?.department === "tischtennis" ? "tischtennis" : null);
  const { data: requiredDepartment } = requestedDepartmentSlug ? await permissionResult.supabaseServer.from("departments").select("id").eq("slug", requestedDepartmentSlug).eq("is_active", true).maybeSingle() : { data: null };
  if (requestedDepartmentSlug && !requiredDepartment?.id) redirect("/admin/unauthorized?reason=missing-department-scope");
  if (hasManagedDepartmentRouteMismatch(scopeContext, requiredDepartment?.id)) redirect("/admin/unauthorized?reason=missing-department-scope");

  if (!canCreateCoachOnServer(scopeContext)) {
    redirect("/admin/unauthorized?reason=missing-coach-scope");
  }

  const teamOptionsResult = await loadScopedCoachTeamSeasonOptions(
    scopeContext,
    permissionResult.supabaseServer,
    { requiredDepartmentId: requiredDepartment?.id || null },
  );

  return (
    <AdminLayout title="Neuer Trainer" subtitle="Trainer">
      <BackButton />
      <AdminCoachesForm teamOptionsResult={teamOptionsResult} sportContext={requestedDepartmentSlug === "tischtennis" ? "table_tennis" : "football"} returnPath={requestedDepartmentSlug ? `/admin/${requestedDepartmentSlug === "fussball" ? "football" : "table-tennis"}/coaches` : "/admin/coaches"} />
    </AdminLayout>
  );
}
