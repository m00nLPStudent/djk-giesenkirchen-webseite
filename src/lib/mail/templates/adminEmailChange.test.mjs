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
  assert.doesNotMatch(confirmation.html.replace(/<[^>]+>/g, ""), /synthetic-token/);
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

test("confirmation CTA fails closed for an unsafe URL", () => {
  const mail = buildAdminEmailChangeConfirmationMail({ confirmationUrl: "javascript:alert(1)" });
  assert.doesNotMatch(`${mail.text}\n${mail.html}`, /javascript:|alert\(1\)/);
  assert.doesNotMatch(mail.html, /<a href=/);
});

test("all four email-change renderers use the shared site-bound design", () => {
  const siteUrl = "https://verein.example";
  const mails = [
    buildAdminEmailChangeOldWarningMail({ siteUrl }),
    buildAdminEmailChangeConfirmationMail({ confirmationUrl: `${siteUrl}/auth/confirm-email-change?token=synthetic-token`, siteUrl }),
    buildAdminEmailChangeOldCompletionMail({ siteUrl }),
    buildAdminEmailChangeNewCompletionMail({ siteUrl }),
  ];
  for (const mail of mails) {
    assert.match(mail.html, /images\/club-logo\.png/);
    assert.match(mail.html, /\/impressum/);
    assert.match(mail.html, /\/datenschutz/);
    assert.ok(mail.text.length > 0);
  }
});
