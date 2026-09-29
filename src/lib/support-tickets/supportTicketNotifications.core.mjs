import { SUPPORT_TICKET_LABELS } from "./supportTickets.core.mjs";

const text = (value, fallback = "") => String(value || "").trim() || fallback;

export function resolveSupportManagers(recipients = [], actorUserId = null) {
  return [...new Map((recipients || [])
    .filter((recipient) => recipient?.isActive !== false)
    .filter((recipient) => recipient?.userId && recipient.userId !== actorUserId)
    .filter((recipient) => recipient.roleKeys?.includes("superadmin") && recipient.permissionKeys?.includes("support_tickets.manage"))
    .map((recipient) => [recipient.userId, recipient])).values()];
}

export function resolveTicketCreator(recipients = [], creatorUserId = null, actorUserId = null) {
  return (recipients || []).find((recipient) => recipient?.isActive !== false && recipient.userId === creatorUserId && recipient.userId !== actorUserId) || null;
}

export function buildSupportTicketNotification(type, ticket = {}, { operationId = null, status = null } = {}) {
  const ticketId = text(ticket.id || ticket.ticketId);
  const ticketNumber = text(ticket.ticket_number || ticket.ticketNumber, "Ticket");
  const subject = text(ticket.subject, "Support-Anfrage");
  const normalizedStatus = text(status || ticket.status);
  const statusLabel = SUPPORT_TICKET_LABELS.status[normalizedStatus] || normalizedStatus;
  const copy = {
    ticket_created: [`Neues Support-Ticket ${ticketNumber}`, `Ein neues Support-Ticket wurde erstellt: ${subject}.`],
    ticket_reply_created: [`Neue Antwort zu ${ticketNumber}`, `Zu ${ticketNumber} (${subject}) ist eine neue Antwort eingegangen.`],
    ticket_status_changed: [`Status von ${ticketNumber} geändert`, `${ticketNumber} (${subject}) hat jetzt den Status „${statusLabel}“.`],
  };
  const [title, message] = copy[type] || ["Support-Ticket aktualisiert", `${ticketNumber} wurde aktualisiert.`];
  return {
    type,
    title,
    message,
    entityType: "support_ticket",
    entityId: ticketId || null,
    targetUrl: ticketId ? `/admin/support/${ticketId}` : "/admin/support",
    metadata: {
      ticketId: ticketId || null,
      ticketNumber,
      subject,
      ...(normalizedStatus ? { status: normalizedStatus } : {}),
      idempotencyKey: `${type}:${operationId || ticketId || "unknown"}`,
    },
  };
}
