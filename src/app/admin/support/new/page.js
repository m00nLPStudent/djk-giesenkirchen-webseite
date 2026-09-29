import { notFound } from "next/navigation";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import SupportTicketCreateForm from "@/components/admin/support/SupportTicketCreateForm";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { supportTicketService } from "@/lib/support-tickets/supportTickets.service";

export const dynamic = "force-dynamic";

export default async function NewSupportTicketPage() {
  const auth = await assertAdminActionPermission({ requiredPermission: "support_tickets.create" });
  if (!auth.ok || (auth.roles || []).some((role) => role?.key === "superadmin")) notFound();
  const areas = await supportTicketService.listAllowedAreas(auth);
  if (!areas.ok) notFound();
  return <AdminLayout title="Neues Ticket" subtitle="Support" showHeader={false}><SupportTicketCreateForm areas={areas.data} /></AdminLayout>;
}
