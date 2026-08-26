import test from "node:test";
import assert from "node:assert/strict";
import { executeMembershipRequestConfirmation, membershipConfirmationIdempotencyKey } from "./membershipMail.core.mjs";

const request = { id: "request-1", email: "member@example.test", first_name: "Mia", last_name: "Muster", request_type: "passives-mitglied", mail_sent_at: null };

test("successful confirmation sends once and marks the request afterwards", async () => {
  const calls = [];
  const result = await executeMembershipRequestConfirmation(request, {
    send: async (mail) => { calls.push(["send", mail]); return { ok: true, status: "sent" }; },
    markSent: async (id, sentAt) => { calls.push(["mark", id, sentAt]); return { data: { id, mail_sent_at: sentAt }, error: null }; },
    now: () => "2026-08-26T12:00:00.000Z",
  });
  assert.equal(result.status, "sent");
  assert.equal(calls[0][0], "send");
  assert.equal(calls[1][0], "mark");
  assert.equal(calls[0][1].to, request.email);
  assert.equal(calls[0][1].idempotencyKey, "membership-request-received/request-1");
});

test("mail_sent_at prevents another provider call", async () => {
  let sends = 0;
  const result = await executeMembershipRequestConfirmation({ ...request, mail_sent_at: "2026-08-26T12:00:00Z" }, { send: async () => { sends += 1; }, markSent: async () => ({ error: null }) });
  assert.equal(result.status, "already_sent");
  assert.equal(sends, 0);
});

test("provider failure never marks the request and keeps a stable retry key", async () => {
  let marks = 0;
  const send = async (mail) => ({ ok: false, status: "failed", error: { code: mail.idempotencyKey } });
  const first = await executeMembershipRequestConfirmation(request, { send, markSent: async () => { marks += 1; } });
  const second = await executeMembershipRequestConfirmation(request, { send, markSent: async () => { marks += 1; } });
  assert.equal(first.error.code, second.error.code);
  assert.equal(first.error.code, membershipConfirmationIdempotencyKey(request.id));
  assert.equal(marks, 0);
});
