import test from "node:test";
import assert from "node:assert/strict";
import { buildMembershipRequestReceivedMail, MEMBERSHIP_CONFIRMATION_SUBJECT } from "./membershipRequestReceived.mjs";

test("membership confirmation renders provider-neutral text and escaped html", () => {
  const mail = buildMembershipRequestReceivedMail({ first_name: "Mia <script>", last_name: "Muster & Co", request_type: "aktives-mitglied-fussball" });
  assert.equal(mail.subject, MEMBERSHIP_CONFIRMATION_SUBJECT);
  assert.match(mail.text, /Mia <script> Muster & Co/);
  assert.match(mail.text, /Aktives Mitglied Fußball/);
  assert.doesNotMatch(mail.html, /<script>/);
  assert.match(mail.html, /Mia &lt;script&gt; Muster &amp; Co/);
});

test("membership confirmation excludes sensitive and internal request data", () => {
  const mail = buildMembershipRequestReceivedMail({ first_name: "Mia", last_name: "Muster", request_type: "trainer-werden", birthdate: "2010-01-01", phone: "12345", message: "privat", internal_note: "intern", id: "request-secret" });
  assert.equal(mail.subject, "Deine Mitgliedsanfrage beim DJK/VfL Giesenkirchen");
  assert.match(mail.text, /Trainer werden/);
  assert.doesNotMatch(JSON.stringify(mail), /2010-01-01|12345|privat|intern|request-secret/);
});
