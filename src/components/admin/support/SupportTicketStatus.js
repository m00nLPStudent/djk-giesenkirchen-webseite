import { AdminStatusChip } from "@/components/admin/design-system";
import { SUPPORT_TICKET_LABELS } from "@/lib/support-tickets/supportTickets.core.mjs";

const STATUS_VARIANTS = { open: "blue", in_progress: "warning", waiting_for_response: "red", completed: "success" };
const PRIORITY_VARIANTS = { low: "neutral", normal: "blue", high: "warning", urgent: "danger" };

export function SupportTicketStatus({ status }) {
  return <AdminStatusChip compact variant={STATUS_VARIANTS[status] || "default"}>{SUPPORT_TICKET_LABELS.status[status] || status}</AdminStatusChip>;
}
export function SupportTicketPriority({ priority }) {
  return <AdminStatusChip compact variant={PRIORITY_VARIANTS[priority] || "default"}>{SUPPORT_TICKET_LABELS.priority[priority] || priority}</AdminStatusChip>;
}
