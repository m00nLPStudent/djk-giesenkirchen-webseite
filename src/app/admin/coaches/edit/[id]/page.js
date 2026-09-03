import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminCoachesForm } from "@/components/admin/coaches";
import CoachDetailOverview from "@/components/admin/coaches/components/CoachDetailOverview";
import { createCoachReadDto } from "@/components/admin/persons/coachReadDto";
import { redirect } from "next/navigation";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import {
  canDeleteCoachOnServer,
  canEditCoachOnServer,
  getCoachTeamIdsMap,
  loadServerPersonScopeContext,
} from "@/components/admin/persons/serverPersonScope";
import { getCoachSeasonalReadModel } from "@/components/admin/persons/coachSeasonalReadModelRepository";
import { loadScopedCoachTeamSeasonOptions } from "@/components/admin/coaches/services/coachTeamSeasonOptions.repository";
import { loadMediaAssetForPicker } from "@/components/admin/media-library/media.service";

export const dynamic = "force-dynamic";

export default async function EditCoachPage({ params, requiredDepartmentSlug = null }) {
  const { id } = await params;
  const permissionResult = await assertAdminActionPermission({
    requiredPermission: "coaches.edit",
  });

  if (!permissionResult.ok) {
    redirect("/admin/unauthorized?reason=missing-coach-permission");
  }

  const scopeContext = await loadServerPersonScopeContext(permissionResult);
  const supabaseServer = permissionResult.supabaseServer;

  const { data: coach } = await supabaseServer
    .from("coaches")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!coach) {
    redirect("/admin/unauthorized?reason=missing-coach-scope");
  }

  const { teamIdsByCoachId, teamById } = await getCoachTeamIdsMap(
    supabaseServer,
    [id],
  );
  const coachTeamIds = teamIdsByCoachId.get(id) || [];
  const { data: requiredDepartment } = requiredDepartmentSlug
    ? await supabaseServer.from("departments").select("id").eq("slug", requiredDepartmentSlug).eq("is_active", true).maybeSingle()
    : { data: null };
  if (requiredDepartmentSlug && coach.department_id !== requiredDepartment?.id) redirect("/admin/unauthorized?reason=missing-coach-scope");
  const returnPath = requiredDepartmentSlug ? `/admin/${requiredDepartmentSlug === "fussball" ? "football" : "table-tennis"}/coaches` : "/admin/coaches";

  if (!canEditCoachOnServer(scopeContext, coach, coachTeamIds, teamById)) {
    redirect("/admin/unauthorized?reason=missing-coach-scope");
  }

  const coachSeasonalReadModel = await getCoachSeasonalReadModel(
    supabaseServer,
    id,
  );
  const teamOptionsResult = await loadScopedCoachTeamSeasonOptions(
    scopeContext,
    supabaseServer,
    { requiredDepartmentId: requiredDepartment?.id || null },
  );
  const canArchive = canDeleteCoachOnServer(
    scopeContext,
    coach,
    coachTeamIds,
    teamById,
  );
  const coachDetail = createCoachReadDto(coach, coachSeasonalReadModel);
  const mediaResult = await loadMediaAssetForPicker(coach.image_media_asset_id);

  return (
    <AdminLayout title="Trainer bearbeiten" subtitle="Trainer" showHeader={false}>
      <CoachDetailOverview
        coach={coachDetail}
        notes={coach.notes || coach.bio_de || coach.bio_en || ""}
        canArchive={canArchive}
        returnPath={returnPath}
      />
      <AdminCoachesForm
        coach={coach}
        teamOptionsResult={teamOptionsResult}
        coachSeasonalReadModel={coachSeasonalReadModel}
        initialMediaAsset={mediaResult.data || null}
        sportContext={requiredDepartmentSlug === "tischtennis" ? "table_tennis" : requiredDepartmentSlug === "fussball" ? "football" : "global"}
        returnPath={returnPath}
      />
    </AdminLayout>
  );
}
