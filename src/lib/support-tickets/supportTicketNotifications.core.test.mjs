import assert from "node:assert/strict";
import test from "node:test";
import { buildSupportTicketNotification, resolveSupportManagers, resolveTicketCreator } from "./supportTicketNotifications.core.mjs";

const recipients = [
  { userId: "actor", isActive: true, roleKeys: ["superadmin"], permissionKeys: ["support_tickets.manage"] },
  { userId: "manager", isActive: true, roleKeys: ["superadmin"], permissionKeys: ["support_tickets.manage"] },
  { userId: "role-only", isActive: true, roleKeys: ["superadmin"], permissionKeys: [] },
  { userId: "permission-only", isActive: true, roleKeys: ["trainer"], permissionKeys: ["support_tickets.manage"] },
  { userId: "inactive", isActive: false, roleKeys: ["superadmin"], permissionKeys: ["support_tickets.manage"] },
  { userId: "creator", isActive: true, roleKeys: ["trainer"], permissionKeys: ["support_tickets.view_own"] },
];

test("support managers require active superadmin role and the real manage permission", () => {
  assert.deepEqual(resolveSupportManagers(recipients, "actor").map((item) => item.userId), ["manager"]);
});

test("creator resolution excludes inactive profiles and self notifications", () => {
  assert.equal(resolveTicketCreator(recipients, "creator", "manager")?.userId, "creator");
  assert.equal(resolveTicketCreator(recipients, "creator", "creator"), null);
  assert.equal(resolveTicketCreator(recipients, "inactive", "manager"), null);
});

test("ticket events use minimal navigation payloads and stable operation keys", () => {
  const ticket = { id: "ticket-id", ticket_number: "SUP-42", subject: "Anzeige prüfen" };
  const created = buildSupportTicketNotification("ticket_created", ticket, { operationId: "ticket-id" });
  const reply = buildSupportTicketNotification("ticket_reply_created", ticket, { operationId: "message-id" });
  const status = buildSupportTicketNotification("ticket_status_changed", ticket, { operationId: "event-id", status: "completed" });
  assert.equal(created.targetUrl, "/admin/support/ticket-id");
  assert.equal(created.metadata.idempotencyKey, "ticket_created:ticket-id");
  assert.equal(reply.metadata.idempotencyKey, "ticket_reply_created:message-id");
  assert.equal(status.metadata.idempotencyKey, "ticket_status_changed:event-id");
  assert.match(status.message, /Abgeschlossen/);
  for (const event of [created, reply, status]) {
    assert.deepEqual(Object.keys(event.metadata).sort(), Object.keys(event.metadata).filter((key) => ["ticketId", "ticketNumber", "subject", "status", "idempotencyKey"].includes(key)).sort());
    assert.doesNotMatch(JSON.stringify(event), /Nachrichteninhalt|roleKeys|permissionKeys|email/i);
  }
});
