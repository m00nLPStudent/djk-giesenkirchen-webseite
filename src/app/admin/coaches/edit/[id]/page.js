import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminCoachesForm } from "@/components/admin/coaches";
import BackButton from "@/components/admin/ui/BackButton";
import { redirect } from "next/navigation";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import {
  canEditCoachOnServer,
  getCoachTeamIdsMap,
  loadServerPersonScopeContext,
} from "@/components/admin/persons/serverPersonScope";
import { getCoachSeasonalReadModel } from "@/components/admin/persons/coachSeasonalReadModelRepository";
import { loadScopedCoachTeamSeasonOptions } from "@/components/admin/coaches/services/coachTeamSeasonOptions.repository";

export const dynamic = "force-dynamic";

export default async function EditCoachPage({ params }) {
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
  );

  return (
    <AdminLayout title="Trainer bearbeiten" subtitle="Trainer">
      <BackButton />
      <AdminCoachesForm
        coach={coach}
        teamOptionsResult={teamOptionsResult}
        coachSeasonalReadModel={coachSeasonalReadModel}
      />
    </AdminLayout>
  );
}
