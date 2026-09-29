import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [service, ticketService, repository] = await Promise.all([
  readFile(new URL("./supportTicketNotifications.service.js", import.meta.url), "utf8"),
  readFile(new URL("./supportTickets.service.js", import.meta.url), "utf8"),
  readFile(new URL("./supportTickets.repository.js", import.meta.url), "utf8"),
]);

test("ticket delivery reuses central recipients and idempotent notification pipeline", () => {
  assert.match(service, /loadAdminNotificationRecipientSource/);
  assert.match(service, /createAdminNotificationRecipients/);
  assert.match(service, /createNotificationsOnce/);
  assert.doesNotMatch(service, /\.from\("notifications"\)|sendMail|resend/i);
});

test("recipient direction follows create, user reply and support reply contracts", () => {
  assert.match(service, /type === "ticket_created" \|\| \(type === "ticket_reply_created" && !actorIsSupport\)/);
  assert.match(service, /resolveSupportManagers/);
  assert.match(service, /resolveTicketCreator/);
});

test("notifications happen only after successful RPC and failure remains best effort", () => {
  for (const rpc of ["createTicketAtomic", "appendTicketReplyAtomic", "mutateTicketAdminAtomic"]) {
    assert.ok(ticketService.indexOf(`repository.${rpc}`) < ticketService.indexOf("notifyBestEffort", ticketService.indexOf(`repository.${rpc}`)));
  }
  assert.match(ticketService, /try[\s\S]*notificationDispatcher[\s\S]*catch \(error\)/);
  assert.match(ticketService, /notificationLogger/);
  assert.doesNotMatch(ticketService, /return fail[^(]*\([^\n]*notification/i);
});

test("status notification uses the atomic audit event and ignores priority or assignment only mutations", () => {
  assert.match(ticketService, /resultingStatus !== existing\.data\.status/);
  assert.match(ticketService, /findLatestStatusEvent/);
  assert.match(repository, /event_type[\s\S]*status_changed[\s\S]*closed[\s\S]*reopened/);
  assert.doesNotMatch(ticketService, /ticket_(?:priority|assignment)_changed/);
});

test("business RPCs are never repeated as a notification retry", () => {
  for (const rpc of ["createTicketAtomic", "appendTicketReplyAtomic", "mutateTicketAdminAtomic"]) {
    assert.equal((ticketService.match(new RegExp(`repository\\.${rpc}\\(`, "g")) || []).length, 1);
  }
});
