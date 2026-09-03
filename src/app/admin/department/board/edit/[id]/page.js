import { redirect } from "next/navigation";
import Can from "@/components/admin/auth/Can";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminBoardMemberForm } from "@/components/admin/board";
import BoardMemberAvatar from "@/components/admin/board/components/BoardMemberAvatar";
import BoardMemberDeleteButton from "@/components/admin/board/components/BoardMemberDeleteButton";
import BoardMemberDetailOverview from "@/components/admin/board/components/BoardMemberDetailOverview";
import BoardMemberStatus from "@/components/admin/board/components/BoardMemberStatus";
import { getBoardMemberName } from "@/components/admin/board/boardUi.helpers";
import { AdminActionBar, AdminButton, AdminDangerZone, AdminDetailHeader, AdminDetailLayout } from "@/components/admin/design-system";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { canDeleteBoardMemberOnServer, canEditBoardMemberOnServer, canManageAllBoardMembersOnServer, loadServerPersonScopeContext } from "@/components/admin/persons/serverPersonScope";
import { loadMediaAssetForPicker } from "@/components/admin/media-library/media.service";
import { getBoardOrganizationLabel } from "@/components/admin/board/boardOrganizationScope.core.mjs";

export const dynamic = "force-dynamic";
const TT_ROLE_SLUGS = ["erster-vorsitzender", "zweiter-vorsitzender", "erster-geschaeftsfuehrer", "zweiter-geschaeftsfuehrer", "kassenwart", "stellvertretender-kassenwart"];

export default async function EditBoardMemberPage({ params, searchParams, requiredDepartmentSlug = null, requiredOrganizationScope = null }) {
  const { id } = await params;
  const query = await searchParams;
  const auth = await assertAdminActionPermission({ requiredPermission: "board.view" });
  if (!auth.ok) redirect("/admin/unauthorized?reason=missing-board-permission");
  const scopeContext = await loadServerPersonScopeContext(auth);
  const { data: member } = await auth.supabaseServer.from("board_members").select("*").eq("id", id).maybeSingle();
  if (!member || !canEditBoardMemberOnServer(scopeContext, member)) redirect("/admin/unauthorized?reason=missing-board-scope");
  const canManageAllBoardMembers = canManageAllBoardMembersOnServer(scopeContext);
  const isClub = requiredOrganizationScope === "club";
  const requestedSlug = ["fussball", "tischtennis"].includes(requiredDepartmentSlug)
    ? requiredDepartmentSlug
    : (["fussball", "tischtennis"].includes(query?.department) ? query.department : null);
  const { data: requestedDepartment } = requestedSlug
    ? await auth.supabaseServer.from("departments").select("id, name_de").eq("slug", requestedSlug).eq("is_active", true).maybeSingle()
    : { data: null };
  const { data: memberDepartment } = member.department_id
    ? await auth.supabaseServer.from("departments").select("id, slug, name_de").eq("id", member.department_id).maybeSingle()
    : { data: null };
  if (requestedSlug && member.department_id !== requestedDepartment?.id) redirect("/admin/unauthorized?reason=missing-board-scope");
  if (isClub && (member.organization_scope !== "club" || member.department_id)) redirect("/admin/unauthorized?reason=missing-board-scope");
  const { data: departments } = canManageAllBoardMembers && !requestedSlug
    ? await auth.supabaseServer.from("departments").select("id, slug, name_de").eq("is_active", true).order("sort_order", { ascending: true })
    : { data: [] };
  const isTableTennis = requestedSlug === "tischtennis";
  let rolesQuery = auth.supabaseServer.from("board_roles").select("*").eq("is_active", true).order("sort_order", { ascending: true });
  if (isTableTennis) rolesQuery = rolesQuery.is("department_id", null).in("slug", TT_ROLE_SLUGS);
  else if (requestedSlug === "fussball") rolesQuery = rolesQuery.or(`department_id.is.null,department_id.eq.${requestedDepartment.id}`);
  else if (isClub) rolesQuery = rolesQuery.is("department_id", null);
  const { data: roles } = await rolesQuery;
  const canDelete = canDeleteBoardMemberOnServer(scopeContext);
  const mediaResult = await loadMediaAssetForPicker(member.image_media_asset_id);
  const name = getBoardMemberName(member);
  const returnPath = isClub ? "/admin/club/board" : requiredDepartmentSlug
    ? `/admin/${isTableTennis ? "table-tennis" : "football"}/board`
    : "/admin/department";
  const label = getBoardOrganizationLabel(
    member,
    memberDepartment?.name_de || requestedDepartment?.name_de || null,
  );
  const dangerZone = canDelete ? <Can permission="board.delete" uiOnly><AdminDangerZone title="Vorstandsmitglied dauerhaft löschen" description="Das Vorstandsprofil wird mit der bestehenden Löschfunktion dauerhaft entfernt."><BoardMemberDeleteButton member={{ id: member.id, first_name: member.first_name, last_name: member.last_name }} /></AdminDangerZone></Can> : null;
  const header = <AdminDetailHeader backHref={returnPath} backLabel="Zurück zu Vorstand & Abteilungen" backVariant="pill" eyebrow={label} title={name} leading={<BoardMemberAvatar member={{ ...member, image_url: mediaResult.data?.previewUrl || member.image_url }} sizeClassName="h-20 w-20" />} status={<BoardMemberStatus member={member} />} meta={`${member.role_de || "Keine Funktion"} · ${label}`} actions={<AdminActionBar><AdminButton href="#board-member-editor" variant="primary">Bearbeiten</AdminButton></AdminActionBar>} />;
  return <AdminLayout title="Vorstandsmitglied bearbeiten" subtitle={label} showHeader={false}><AdminDetailLayout header={header} dangerZone={dangerZone}><BoardMemberDetailOverview member={member} departmentLabel={label} /><AdminBoardMemberForm member={member} roles={roles || []} departments={departments || []} canManageOrganizationScope={canManageAllBoardMembers && !requestedSlug && !isClub} canManageStructuralFields={canManageAllBoardMembers} canManageUnassigned={scopeContext.isGlobal} initialMedia={mediaResult.data || null} returnPath={returnPath} departmentSlug={requestedSlug} organizationScope={isClub ? "club" : null} departmentLabel={label} /></AdminDetailLayout></AdminLayout>;
}
