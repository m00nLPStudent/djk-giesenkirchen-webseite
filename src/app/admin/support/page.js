import { notFound } from "next/navigation";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import SupportTicketsModule from "@/components/admin/support/SupportTicketsModule";
import { assertAdminActionPermission, assertSuperadminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { supportTicketService } from "@/lib/support-tickets/supportTickets.service";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const base = await assertAdminActionPermission({ requiredPermission: null });
  if (!base.ok) notFound();
  const isSuperadmin = (base.roles || []).some((role) => role?.key === "superadmin");
  const auth = isSuperadmin ? await assertSuperadminActionPermission({ requiredPermission: "support_tickets.manage" }) : await assertAdminActionPermission({ requiredPermission: "support_tickets.view_own" });
  if (!auth.ok) notFound();
  const result = await supportTicketService.listTickets({}, auth);
  const canCreate = !isSuperadmin && (auth.permissions || []).includes("support_tickets.create");
  return <AdminLayout title="Support" subtitle="Tickets" showHeader={false}><SupportTicketsModule tickets={result.ok ? result.data : []} isSuperadmin={isSuperadmin} canCreate={canCreate} loadError={result.ok ? null : result.message} /></AdminLayout>;
}
