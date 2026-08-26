import test from "node:test";
import assert from "node:assert/strict";
import { executeResendSend, RESEND_EMAIL_ENDPOINT } from "./resend.provider.core.mjs";

const message = { to: "person@example.test", subject: "Test", text: "Text", html: "<p>Text</p>", idempotencyKey: "membership-request-received/request-1" };

test("missing Resend configuration skips without a network call", async () => {
  let calls = 0;
  const result = await executeResendSend(message, { fetchImpl: async () => { calls += 1; } });
  assert.equal(result.status, "skipped");
  assert.equal(result.error.code, "mail_provider_not_configured");
  assert.equal(calls, 0);
});

test("Resend adapter sends the stable key and minimal provider payload", async () => {
  let captured;
  const result = await executeResendSend(message, { apiKey: "test-key", from: "Club <mail@example.test>", replyTo: "reply@example.test", fetchImpl: async (...args) => { captured = args; return { ok: true, json: async () => ({ id: "provider-1" }) }; } });
  assert.equal(captured[0], RESEND_EMAIL_ENDPOINT);
  assert.equal(captured[1].headers["Idempotency-Key"], message.idempotencyKey);
  assert.equal(captured[1].headers.Authorization, "Bearer test-key");
  assert.deepEqual(JSON.parse(captured[1].body), { from: "Club <mail@example.test>", to: [message.to], subject: message.subject, text: message.text, html: message.html, reply_to: "reply@example.test" });
  assert.deepEqual(result, { ok: true, status: "sent", providerMessageId: "provider-1", error: null });
});

test("Resend errors are normalized without exposing provider response bodies", async () => {
  const result = await executeResendSend(message, { apiKey: "test-key", from: "mail@example.test", fetchImpl: async () => ({ ok: false, status: 401 }) });
  assert.equal(result.error.code, "provider_http_401");
  assert.doesNotMatch(JSON.stringify(result), /test-key|person@example/);
});
