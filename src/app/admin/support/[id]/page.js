import { notFound } from "next/navigation";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import SupportTicketDetail from "@/components/admin/support/SupportTicketDetail";
import { assertAdminActionPermission, assertSuperadminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { SUPPORT_TICKET_ERROR_CODES } from "@/lib/support-tickets/supportTickets.core.mjs";
import { supportTicketService } from "@/lib/support-tickets/supportTickets.service";

export const dynamic = "force-dynamic";

export default async function SupportTicketPage({ params }) {
  const { id } = await params;
  const base = await assertAdminActionPermission();
  if (!base.ok) notFound();
  const isSuperadmin = (base.roles || []).some((role) => role?.key === "superadmin");
  const auth = isSuperadmin ? await assertSuperadminActionPermission({ requiredPermission: "support_tickets.manage" }) : await assertAdminActionPermission({ requiredPermission: "support_tickets.view_own" });
  if (!auth.ok) notFound();
  const result = await supportTicketService.getTicketDetail(id, auth);
  if (!result.ok && result.code === SUPPORT_TICKET_ERROR_CODES.NOT_FOUND) notFound();
  const assignees = isSuperadmin ? await supportTicketService.listAssignableProfiles(auth) : { ok: true, data: [] };
  return <AdminLayout title="Ticketdetails" subtitle="Support" showHeader={false}><SupportTicketDetail ticket={result.ok ? result.data : null} isSuperadmin={isSuperadmin} assignees={assignees.ok ? assignees.data : []} loadError={result.ok ? null : result.message} /></AdminLayout>;
}
