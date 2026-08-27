import assert from "node:assert/strict";
import test from "node:test";
import { AUTH_MAIL_RATE_LIMIT_MESSAGE, getAuthMailErrorMessage, isAuthMailRateLimitError } from "./authMailErrors.mjs";

test("normalizes the Supabase auth mail rate-limit code", () => {
  const error = { code: "over_email_send_rate_limit", message: "provider detail" };
  assert.equal(isAuthMailRateLimitError(error), true);
  assert.equal(getAuthMailErrorMessage(error, "Anderer Fehler"), AUTH_MAIL_RATE_LIMIT_MESSAGE);
  assert.doesNotMatch(getAuthMailErrorMessage(error, "Anderer Fehler"), /over_email_send_rate_limit|provider/i);
});

test("normalizes the Supabase auth mail rate-limit message", () => {
  assert.equal(getAuthMailErrorMessage({ message: "Email rate limit exceeded" }, "Anderer Fehler"), AUTH_MAIL_RATE_LIMIT_MESSAGE);
});

test("keeps unrelated auth mail errors differentiated", () => {
  assert.equal(isAuthMailRateLimitError({ code: "email_address_invalid", message: "invalid" }), false);
  assert.equal(getAuthMailErrorMessage({ code: "email_address_invalid" }, "E-Mail ist ungültig."), "E-Mail ist ungültig.");
});
