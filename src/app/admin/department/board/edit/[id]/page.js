import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminBoardMemberForm } from "@/components/admin/board";
import { redirect } from "next/navigation";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import {
  canEditBoardMemberOnServer,
  loadServerPersonScopeContext,
} from "@/components/admin/persons/serverPersonScope";

export const dynamic = "force-dynamic";

export default async function EditBoardMemberPage({ params }) {
  const { id } = await params;

  const permissionResult = await assertAdminActionPermission({
    requiredPermission: "settings.view",
  });

  if (!permissionResult.ok) {
    redirect("/admin/unauthorized?reason=missing-board-permission");
  }

  const scopeContext = await loadServerPersonScopeContext(permissionResult);

  const { data: member } = await permissionResult.supabaseServer
    .from("board_members")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!member || !canEditBoardMemberOnServer(scopeContext, member)) {
    redirect("/admin/unauthorized?reason=missing-board-scope");
  }

  const { data: roles } = await permissionResult.supabaseServer
    .from("board_roles")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <AdminLayout title="Vorstandsmitglied bearbeiten" subtitle="Abteilung">
      <AdminBoardMemberForm member={member} roles={roles || []} />
    </AdminLayout>
  );
}
