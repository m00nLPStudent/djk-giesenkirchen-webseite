import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminBoardList } from "@/components/admin/board";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { canCreateBoardMemberOnServer, canDeleteBoardMemberOnServer, canEditBoardMemberOnServer, canViewBoardMemberOnServer, loadServerPersonScopeContext } from "@/components/admin/persons/serverPersonScope";

export const dynamic = "force-dynamic";

export default async function AdminDepartmentPage() {
  const permissionResult = await assertAdminActionPermission({ requiredPermission: "settings.view" });
  if (!permissionResult.ok) redirect("/admin/unauthorized?reason=missing-department-permission");
  const scopeContext = await loadServerPersonScopeContext(permissionResult);
  const canCreateBoardMembers = canCreateBoardMemberOnServer(scopeContext);
  const { data: members } = await permissionResult.supabaseServer.from("board_members").select("id, role_id, first_name, last_name, role_de, role_en, email, phone, image_url, is_active, sort_order, admin_profile_id").order("sort_order", { ascending: true });
  const canViewBoardModule = canViewBoardMemberOnServer(scopeContext);
  const membersForUi = !canViewBoardModule ? [] : (members || []).map((member) => ({ ...member, _canEditInScope: canEditBoardMemberOnServer(scopeContext, member), _canDeleteInScope: canDeleteBoardMemberOnServer(scopeContext) }));
  return <AdminLayout title="Abteilung" subtitle="Adminbereich" showHeader={false}><AdminBoardList members={membersForUi} canCreate={canCreateBoardMembers} /></AdminLayout>;
}
