import assert from "node:assert/strict";
import test from "node:test";
import {
  ADMIN_EMAIL_CHANGE_SUBJECTS,
  buildAdminEmailChangeConfirmationMail,
  buildAdminEmailChangeNewCompletionMail,
  buildAdminEmailChangeOldCompletionMail,
  buildAdminEmailChangeOldWarningMail,
} from "./adminEmailChange.mjs";

test("request mails keep the confirmation link exclusively at the new address", () => {
  const warning = buildAdminEmailChangeOldWarningMail();
  const confirmation = buildAdminEmailChangeConfirmationMail({
    confirmationUrl: "https://club.example.test/auth/confirm-email-change?token=synthetic-token",
  });
  assert.equal(warning.subject, ADMIN_EMAIL_CHANGE_SUBJECTS.requestedOld);
  assert.doesNotMatch(JSON.stringify(warning), /token=|confirm-email-change/);
  assert.equal(confirmation.subject, ADMIN_EMAIL_CHANGE_SUBJECTS.confirmNew);
  assert.match(confirmation.text, /15 Minuten/);
  assert.match(confirmation.html, /Neue E-Mail-Adresse bestätigen/);
  assert.match(confirmation.text, /token=synthetic-token/);
});

test("completion mails are technical transition templates without provider or account data", () => {
  const oldMail = buildAdminEmailChangeOldCompletionMail();
  const newMail = buildAdminEmailChangeNewCompletionMail();
  assert.equal(oldMail.subject, ADMIN_EMAIL_CHANGE_SUBJECTS.completedOld);
  assert.equal(newMail.subject, ADMIN_EMAIL_CHANGE_SUBJECTS.completedNew);
  assert.match(oldMail.text, /bisherige Adresse kann nicht mehr/);
  assert.match(newMail.text, /ab sofort/);
  assert.doesNotMatch(JSON.stringify({ oldMail, newMail }), /api.?key|provider|uuid|password/i);
});
