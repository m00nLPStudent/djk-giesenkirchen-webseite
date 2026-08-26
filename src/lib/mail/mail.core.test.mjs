import test from "node:test";
import assert from "node:assert/strict";
import { createMailIdempotencyKey, escapeMailHtml, normalizeMailHeader, validateMailMessage } from "./mail.core.mjs";

test("mail primitives escape dynamic html and reject header injection", () => {
  assert.equal(escapeMailHtml('<Mia & "Max">'), "&lt;Mia &amp; &quot;Max&quot;&gt;");
  assert.equal(normalizeMailHeader("Betreff\r\nBcc: secret@example.test"), "Betreff Bcc: secret@example.test");
  assert.equal(createMailIdempotencyKey("membership-request-received", "request-1"), "membership-request-received/request-1");
});

test("mail message validation produces a provider-neutral minimal DTO", () => {
  const result = validateMailMessage({ to: " TEST@Example.test ", subject: "Hallo", text: "Text", html: "<p>Text</p>", idempotencyKey: "event/id" });
  assert.deepEqual(result.data, { to: "test@example.test", subject: "Hallo", text: "Text", html: "<p>Text</p>", idempotencyKey: "event/id" });
  assert.equal(validateMailMessage({ to: "invalid" }).error.code, "invalid_mail_message");
});
