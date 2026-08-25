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
import { canDeleteBoardMemberOnServer, canEditBoardMemberOnServer, loadServerPersonScopeContext } from "@/components/admin/persons/serverPersonScope";
import { loadMediaAssetForPicker } from "@/components/admin/media-library/media.service";

export const dynamic = "force-dynamic";

export default async function EditBoardMemberPage({ params }) {
  const { id } = await params;
  const permissionResult = await assertAdminActionPermission({ requiredPermission: "settings.view" });
  if (!permissionResult.ok) redirect("/admin/unauthorized?reason=missing-board-permission");
  const scopeContext = await loadServerPersonScopeContext(permissionResult);
  const { data: member } = await permissionResult.supabaseServer.from("board_members").select("*").eq("id", id).maybeSingle();
  if (!member || !canEditBoardMemberOnServer(scopeContext, member)) redirect("/admin/unauthorized?reason=missing-board-scope");
  const { data: roles } = await permissionResult.supabaseServer.from("board_roles").select("*").eq("is_active", true).order("sort_order", { ascending: true });
  const canDelete = canDeleteBoardMemberOnServer(scopeContext);
  const mediaResult = await loadMediaAssetForPicker(member.image_media_asset_id);
  const name = getBoardMemberName(member);
  const dangerZone = canDelete ? <Can permission="settings.edit" uiOnly><AdminDangerZone title="Vorstandsmitglied dauerhaft löschen" description="Das Vorstandsprofil wird mit der bestehenden Löschfunktion dauerhaft entfernt."><BoardMemberDeleteButton member={{ id: member.id, first_name: member.first_name, last_name: member.last_name }} /></AdminDangerZone></Can> : null;
  return <AdminLayout title="Vorstandsmitglied bearbeiten" subtitle="Abteilung" showHeader={false}><AdminDetailLayout header={<AdminDetailHeader backHref="/admin/department" backLabel="Zurück zu Vorstand & Abteilungen" backVariant="pill" eyebrow="Fußballabteilung" title={name} leading={<BoardMemberAvatar member={{ ...member, image_url: mediaResult.data?.previewUrl || member.image_url }} sizeClassName="h-20 w-20" />} status={<BoardMemberStatus member={member} />} meta={`${member.role_de || "Keine Funktion"} · Fußballabteilung`} actions={<AdminActionBar><AdminButton href="#board-member-editor" variant="primary">Bearbeiten</AdminButton></AdminActionBar>} />} dangerZone={dangerZone}><BoardMemberDetailOverview member={member} /><AdminBoardMemberForm member={member} roles={roles || []} initialMedia={mediaResult.data || null} /></AdminDetailLayout></AdminLayout>;
}
