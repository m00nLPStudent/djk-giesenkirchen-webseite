import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminCoachesForm } from "@/components/admin/coaches";
import BackButton from "@/components/admin/ui/BackButton";
import { redirect } from "next/navigation";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import {
  canCreateCoachOnServer,
  loadScopedActiveTeamsForPeople,
  loadServerPersonScopeContext,
} from "@/components/admin/persons/serverPersonScope";

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

  const teams = await loadScopedActiveTeamsForPeople(
    scopeContext,
    permissionResult.supabaseServer,
  );

  return (
    <AdminLayout title="Neuer Trainer" subtitle="Trainer">
      <BackButton />
      <AdminCoachesForm teams={teams || []} />
    </AdminLayout>
  );
}
