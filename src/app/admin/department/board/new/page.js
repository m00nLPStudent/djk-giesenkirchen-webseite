import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminBoardMemberForm } from "@/components/admin/board";
import { redirect } from "next/navigation";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import {
  canCreateBoardMemberOnServer,
  loadServerPersonScopeContext,
} from "@/components/admin/persons/serverPersonScope";

export const dynamic = "force-dynamic";

export default async function NewBoardMemberPage() {
  const permissionResult = await assertAdminActionPermission({
    requiredPermission: "settings.edit",
  });

  if (!permissionResult.ok) {
    redirect("/admin/unauthorized?reason=missing-board-permission");
  }

  const scopeContext = await loadServerPersonScopeContext(permissionResult);
  if (!canCreateBoardMemberOnServer(scopeContext)) {
    redirect("/admin/unauthorized?reason=missing-board-scope");
  }

  const { data: roles } = await permissionResult.supabaseServer
    .from("board_roles")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <AdminLayout title="Neues Vorstandsmitglied" subtitle="Abteilung">
      <AdminBoardMemberForm roles={roles || []} />
    </AdminLayout>
  );
}
