import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminCoachesOverview } from "@/components/admin/coaches";
import { createCoachReadDto } from "@/components/admin/persons/coachReadDto";
import { getCoachSeasonalReadModelsMap } from "@/components/admin/persons/coachSeasonalReadModelRepository";
import {
  canCreateCoachOnServer,
  canEditCoachOnServer,
  canViewCoachOnServer,
  getCoachTeamIdsMap,
  loadServerPersonScopeContext,
} from "@/components/admin/persons/serverPersonScope";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { redirect } from "next/navigation";
import { hasManagedDepartmentRouteMismatch } from "@/lib/admin-auth/scopes/departmentManagerScope.core.mjs";

export const dynamic = "force-dynamic";

export default async function AdminCoachesPage({ requiredDepartmentSlug = null } = {}) {
  const permissionResult = await assertAdminActionPermission({
    requiredPermission: "coaches.view",
  });

  if (!permissionResult.ok) {
    redirect("/admin/unauthorized?reason=missing-coach-permission");
  }

  const scopeContext = await loadServerPersonScopeContext(permissionResult);
  const canCreateCoaches = canCreateCoachOnServer(scopeContext);
  const supabaseServer = permissionResult.supabaseServer;

  const { data: requiredDepartment } = requiredDepartmentSlug
    ? await supabaseServer.from("departments").select("id, slug").eq("slug", requiredDepartmentSlug).eq("is_active", true).maybeSingle()
    : { data: null };
  if (requiredDepartmentSlug && !requiredDepartment?.id) redirect("/admin/unauthorized?reason=missing-department-scope");
  if (hasManagedDepartmentRouteMismatch(scopeContext, requiredDepartment?.id)) redirect("/admin/unauthorized?reason=missing-department-scope");
  let coachesQuery = supabaseServer
    .from("coaches")
    .select(
      "id, first_name, last_name, name, slug, role, role_de, role_en, email, nationality, image_url, photo_url, is_active, admin_profile_id, sort_order, department_id, departments(name_de, slug)",
    )
    .order("sort_order", { ascending: true });
  if (requiredDepartment?.id) coachesQuery = coachesQuery.eq("department_id", requiredDepartment.id);
  const { data: coaches } = await coachesQuery;

  const coachListRaw = coaches || [];
  const coachIds = coachListRaw.map((coach) => coach.id).filter(Boolean);
  const coachReadModels = await getCoachSeasonalReadModelsMap(
    supabaseServer,
    coachIds,
  );
  const { teamIdsByCoachId, teamById } = await getCoachTeamIdsMap(
    supabaseServer,
    coachIds,
  );

  const coachList = coachListRaw
    .filter((coach) => {
      const coachTeamIds = teamIdsByCoachId.get(coach.id) || [];
      return canViewCoachOnServer(scopeContext, coach, coachTeamIds, teamById);
    })
    .map((coach) => {
      const coachTeamIds = teamIdsByCoachId.get(coach.id) || [];
      const dto = createCoachReadDto(
        coach,
        coachReadModels.get(coach.id) || {},
        { includeAdminProfileLinked: true },
      );

      return {
        ...dto,
        departmentId: coach.department_id || null,
        departmentName: coach.departments?.name_de || null,
        is_active: dto.isActive,
        image_url: dto.imageUrl,
        _canEditInScope: canEditCoachOnServer(
          scopeContext,
          coach,
          coachTeamIds,
          teamById,
        ),
      };
    });

  const departmentRoute = requiredDepartmentSlug ? (requiredDepartmentSlug === "fussball" ? "football" : "table-tennis") : null;
  return (
    <AdminLayout
      title="Trainer verwalten"
      subtitle="Adminbereich"
      showHeader={false}
    >
      <AdminCoachesOverview coaches={coachList} canCreate={canCreateCoaches} createHref={departmentRoute ? `/admin/${departmentRoute}/coaches/new` : "/admin/coaches/new"} basePath={departmentRoute ? `/admin/${departmentRoute}/coaches` : "/admin/coaches"} />
    </AdminLayout>
  );
}
