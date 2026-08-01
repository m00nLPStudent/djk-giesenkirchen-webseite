import Link from "next/link";
import { redirect } from "next/navigation";
import Can from "@/components/admin/auth/Can";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import AdminPageSection from "@/components/admin/layout/AdminPageSection";
import { AdminBoardList } from "@/components/admin/board";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import {
  canCreateBoardMemberOnServer,
  canDeleteBoardMemberOnServer,
  canEditBoardMemberOnServer,
  canViewBoardMemberOnServer,
  loadServerPersonScopeContext,
} from "@/components/admin/persons/serverPersonScope";

export const dynamic = "force-dynamic";

export default async function AdminDepartmentPage() {
  const permissionResult = await assertAdminActionPermission({
    requiredPermission: "settings.view",
  });

  if (!permissionResult.ok) {
    redirect("/admin/unauthorized?reason=missing-department-permission");
  }

  const scopeContext = await loadServerPersonScopeContext(permissionResult);
  const canCreateBoardMembers = canCreateBoardMemberOnServer(scopeContext);
  const { data: members } = await permissionResult.supabaseServer
    .from("board_members")
    .select(
      "id, role_id, first_name, last_name, role_de, role_en, email, phone, image_url, is_active, sort_order, admin_profile_id",
    )
    .order("sort_order", { ascending: true });

  const canViewBoardModule = canViewBoardMemberOnServer(scopeContext);
  const membersForUi = !canViewBoardModule
    ? []
    : (members || []).map((member) => ({
        id: member.id,
        role_id: member.role_id,
        first_name: member.first_name,
        last_name: member.last_name,
        role_de: member.role_de,
        role_en: member.role_en,
        email: member.email,
        phone: member.phone,
        image_url: member.image_url,
        is_active: member.is_active,
        sort_order: member.sort_order,
        _canEditInScope: canEditBoardMemberOnServer(scopeContext, member),
        _canDeleteInScope: canDeleteBoardMemberOnServer(scopeContext),
      }));

  return (
    <AdminLayout title="Abteilung" subtitle="Adminbereich" showHeader={false}>
      <AdminPageHeader
        eyebrow="Abteilung"
        title="Abteilung"
        description="Vorstand und organisatorische Strukturen für die öffentliche Darstellung pflegen."
        actions={
          canCreateBoardMembers ? (
            <Can permission="settings.edit" uiOnly>
              <Link
                href="/admin/department/board/new"
                className="rounded-full bg-red-600 px-6 py-3 font-bold transition hover:bg-red-700"
              >
                Neues Vorstandsmitglied
              </Link>
            </Can>
          ) : null
        }
      />

      <AdminPageSection
        eyebrow="Fußballabteilung"
        title="Vorstand verwalten"
        description="Hier werden die Personen gepflegt, die öffentlich auf der Abteilungsseite im Bereich Vorstand angezeigt werden."
      >
        <AdminBoardList members={membersForUi} />
      </AdminPageSection>
    </AdminLayout>
  );
}
