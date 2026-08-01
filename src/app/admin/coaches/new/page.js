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

export const dynamic = "force-dynamic";

export default async function NewCoachPage() {
  const permissionResult = await assertAdminActionPermission({
    requiredPermission: "coaches.create",
  });

  if (!permissionResult.ok) {
    redirect("/admin/unauthorized?reason=missing-coach-permission");
  }

  const scopeContext = await loadServerPersonScopeContext(permissionResult);

  if (!canCreateCoachOnServer(scopeContext)) {
    redirect("/admin/unauthorized?reason=missing-coach-scope");
  }

  const teamOptionsResult = await loadScopedCoachTeamSeasonOptions(
    scopeContext,
    permissionResult.supabaseServer,
  );

  return (
    <AdminLayout title="Neuer Trainer" subtitle="Trainer">
      <BackButton />
      <AdminCoachesForm teamOptionsResult={teamOptionsResult} />
    </AdminLayout>
  );
}
