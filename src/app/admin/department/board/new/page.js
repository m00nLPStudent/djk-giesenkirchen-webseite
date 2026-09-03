import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminBoardMemberForm } from "@/components/admin/board";
import { AdminDetailHeader, AdminDetailLayout, AdminStatusChip } from "@/components/admin/design-system";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { canCreateBoardMemberOnServer, canManageAllBoardMembersOnServer, loadServerPersonScopeContext } from "@/components/admin/persons/serverPersonScope";

export const dynamic = "force-dynamic";
const TT_ROLE_SLUGS = ["erster-vorsitzender", "zweiter-vorsitzender", "erster-geschaeftsfuehrer", "zweiter-geschaeftsfuehrer", "kassenwart", "stellvertretender-kassenwart"];

export default async function NewBoardMemberPage({ searchParams, requiredDepartmentSlug = null, requiredOrganizationScope = null }) {
  const params = await searchParams;
  const auth = await assertAdminActionPermission({ requiredPermission: "board.create" });
  if (!auth.ok) redirect("/admin/unauthorized?reason=missing-board-permission");
  const scopeContext = await loadServerPersonScopeContext(auth);
  if (!canCreateBoardMemberOnServer(scopeContext)) redirect("/admin/unauthorized?reason=missing-board-scope");
  const canManageAllBoardMembers = canManageAllBoardMembersOnServer(scopeContext);
  const isClub = requiredOrganizationScope === "club";
  const requestedSlug = ["fussball", "tischtennis"].includes(requiredDepartmentSlug)
    ? requiredDepartmentSlug
    : (["fussball", "tischtennis"].includes(params?.department) ? params.department : null);
  const { data: requestedDepartment } = requestedSlug ? await auth.supabaseServer.from("departments").select("id, slug, name_de").eq("slug", requestedSlug).eq("is_active", true).maybeSingle() : { data: null };
  if (requestedSlug && !requestedDepartment) redirect("/admin/unauthorized?reason=missing-department-scope");
  if (scopeContext.managedDepartmentId && requestedDepartment?.id && requestedDepartment.id !== scopeContext.managedDepartmentId) redirect("/admin/unauthorized?reason=missing-board-scope");
  if (isClub && !canManageAllBoardMembers) redirect("/admin/unauthorized?reason=missing-board-scope");
  const departmentId = isClub ? null : requestedDepartment?.id || scopeContext.managedDepartmentId || null;
  const organizationScope = isClub ? "club" : departmentId ? "department" : (scopeContext.isGlobal ? "unassigned" : "club");
  const { data: departments } = canManageAllBoardMembers && !requestedSlug
    ? await auth.supabaseServer.from("departments").select("id, slug, name_de").eq("is_active", true).order("sort_order", { ascending: true })
    : { data: [] };
  let rolesQuery = auth.supabaseServer.from("board_roles").select("*").eq("is_active", true).order("sort_order", { ascending: true });
  if (requestedSlug === "tischtennis") rolesQuery = rolesQuery.is("department_id", null).in("slug", TT_ROLE_SLUGS);
  else if (requestedSlug === "fussball") rolesQuery = rolesQuery.or(`department_id.is.null,department_id.eq.${requestedDepartment.id}`);
  else if (isClub) rolesQuery = rolesQuery.is("department_id", null);
  const { data: roles } = await rolesQuery;
  const label = isClub ? "Gesamtverein" : requestedDepartment?.name_de || "Nicht zugeordnet";
  const returnPath = isClub ? "/admin/club/board" : requestedSlug
    ? `/admin/${requestedSlug === "fussball" ? "football" : "table-tennis"}/board`
    : "/admin/department";
  const header = <AdminDetailHeader backHref={returnPath} backLabel="Zurück zum Vorstand" backVariant="pill" eyebrow={label} title="Neuer Eintrag" status={<AdminStatusChip compact>Entwurf</AdminStatusChip>} meta="Vorstandsmitglied und öffentliche Kontaktdaten anlegen." />;
  return <AdminLayout title="Neues Vorstandsmitglied" subtitle={label} showHeader={false}><AdminDetailLayout header={header}><AdminBoardMemberForm member={{ department_id: departmentId, organization_scope: organizationScope }} roles={roles || []} departments={departments || []} canManageOrganizationScope={canManageAllBoardMembers && !requestedSlug && !isClub} canManageUnassigned={scopeContext.isGlobal} returnPath={returnPath} departmentSlug={requestedSlug} organizationScope={isClub ? "club" : null} departmentLabel={label} /></AdminDetailLayout></AdminLayout>;
}
