import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminBoardList } from "@/components/admin/board";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { canCreateBoardMemberOnServer, canDeleteBoardMemberOnServer, canEditBoardMemberOnServer, canViewBoardMemberOnServer, loadServerPersonScopeContext } from "@/components/admin/persons/serverPersonScope";
import { canManageMedia, loadMediaUrlMap } from "@/components/admin/media-library/media.service";
import { getBoardOrganizationLabel } from "@/components/admin/board/boardOrganizationScope.core.mjs";
import { hasManagedDepartmentRouteMismatch } from "@/lib/admin-auth/scopes/departmentManagerScope.core.mjs";

export const dynamic = "force-dynamic";

export default async function AdminDepartmentPage({ requiredDepartmentSlug = null, requiredOrganizationScope = null } = {}) {
  const permissionResult = await assertAdminActionPermission({ requiredPermission: "board.view" });
  if (!permissionResult.ok) redirect("/admin/unauthorized?reason=missing-department-permission");
  const scopeContext = await loadServerPersonScopeContext(permissionResult);
  const { data: requiredDepartment } = requiredDepartmentSlug
    ? await permissionResult.supabaseServer.from("departments").select("id, slug, name_de").eq("slug", requiredDepartmentSlug).eq("is_active", true).maybeSingle()
    : { data: null };
  if (requiredDepartmentSlug && !requiredDepartment?.id) redirect("/admin/unauthorized?reason=missing-department-scope");
  if (hasManagedDepartmentRouteMismatch(scopeContext, requiredDepartment?.id)) redirect("/admin/unauthorized?reason=missing-department-scope");
  const canCreateBoardMembers = canCreateBoardMemberOnServer(scopeContext);
  let membersQuery = permissionResult.supabaseServer.from("board_members").select("id, role_id, organization_scope, department_id, first_name, last_name, role_de, role_en, email, phone, image_url, image_media_asset_id, is_active, sort_order, admin_profile_id, departments(name_de)").order("sort_order", { ascending: true });
  const boardDepartmentId = requiredDepartment?.id || scopeContext.managedDepartmentId;
  if (boardDepartmentId) membersQuery = membersQuery.eq("organization_scope", "department").eq("department_id", boardDepartmentId);
  else if (requiredOrganizationScope === "club") membersQuery = membersQuery.eq("organization_scope", "club").is("department_id", null);
  const { data: members } = await membersQuery;
  const allowedVisibilities = canManageMedia(permissionResult.roles) ? ["public", "admin"] : ["public"];
  const mediaUrls = await loadMediaUrlMap((members || []).map((member) => member.image_media_asset_id), allowedVisibilities);
  const membersForUi = (members || [])
    .filter((member) => canViewBoardMemberOnServer(scopeContext, member))
    .map((member) => {
      const department = Array.isArray(member.departments) ? member.departments[0] : member.departments;
      return { ...member, image_url: mediaUrls.data.get(member.image_media_asset_id) || member.image_url, _organizationLabel: getBoardOrganizationLabel(member, department?.name_de), _canEditInScope: canEditBoardMemberOnServer(scopeContext, member), _canDeleteInScope: canDeleteBoardMemberOnServer(scopeContext) };
    });
  const isClub = requiredOrganizationScope === "club";
  const basePath = isClub ? "/admin/club/board" : requiredDepartment?.slug ? `/admin/${requiredDepartment.slug === "fussball" ? "football" : "table-tennis"}/board` : "/admin/department/board";
  const title = isClub ? "Vorstand Gesamtverein" : requiredDepartment?.slug === "fussball" ? "Vorstand Fußball" : requiredDepartment?.slug === "tischtennis" ? "Vorstand Tischtennis" : "Vorstand & Abteilungen";
  return <AdminLayout title={title} subtitle="Adminbereich" showHeader={false}><AdminBoardList members={membersForUi} canCreate={canCreateBoardMembers} basePath={basePath} organizationLabel={isClub ? "Gesamtverein" : requiredDepartment?.name_de || "Organisationsbereich"} title={title} eyebrow={isClub ? "Gesamtverein" : "Abteilung"} /></AdminLayout>;
}
