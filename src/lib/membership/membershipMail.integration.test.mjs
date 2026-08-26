import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [action, service, repository, membershipMail, mailService, provider, form] = await Promise.all([
  read("../../app/membership/actions.js"),
  read("./membership.service.js"),
  read("./membership.repository.js"),
  read("./membership.mail.js"),
  read("../mail/mail.service.js"),
  read("../mail/providers/resend.provider.js"),
  read("../../components/website/membership/MembershipRequestForm.js"),
]);

test("public orchestration is insert then internal notification then confirmation mail", () => {
  const insert = action.indexOf("await submitMembershipRequest(payload, { client })");
  const notification = action.indexOf("await notifyMembershipWorkflow");
  const mail = action.indexOf("await sendMembershipRequestConfirmation(result.data, { client })");
  assert.ok(insert >= 0 && notification > insert && mail > notification);
  assert.equal((action.match(/submitMembershipRequest\(payload/g) || []).length, 1);
  assert.doesNotMatch(service, /sendMembershipRequestConfirmation|sendMembershipRequestNotifications/);
});

test("confirmation uses the persisted insert response and conditionally marks mail_sent_at server-side", () => {
  assert.match(repository, /select\("id, first_name, last_name, email, request_type, mail_sent_at, created_at"\)/);
  assert.match(repository, /update\(\{ mail_sent_at: sentAt \}\).*\.eq\("id", id\)\.is\("mail_sent_at", null\)/);
  assert.match(membershipMail, /executeMembershipRequestConfirmation\(request/);
  assert.match(action, /sendMembershipRequestConfirmation\(result\.data/);
  assert.doesNotMatch(action, /payload\.email/);
});

test("mail and provider modules are server-only and secrets never enter membership or client sources", () => {
  for (const source of [membershipMail, mailService, provider]) assert.match(source, /server-only/);
  for (const source of [action, service, repository, membershipMail, form]) assert.doesNotMatch(source, /RESEND_API_KEY|MAIL_FROM|MAIL_REPLY_TO|MAIL_PROVIDER/);
  assert.doesNotMatch(form, /mail_sent_at|sendMail|resend/i);
});

test("provider and marker failures remain best effort after the successful insert", () => {
  assert.match(action, /try[\s\S]*sendMembershipRequestConfirmation[\s\S]*catch/);
  assert.match(action, /logMailFailure/);
  assert.ok(action.indexOf("sendMembershipRequestConfirmation") < action.lastIndexOf("return { data: null"));
});
