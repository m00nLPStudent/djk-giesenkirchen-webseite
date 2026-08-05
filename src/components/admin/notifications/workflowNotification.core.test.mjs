import test from "node:test";
import assert from "node:assert/strict";
import { buildContributionNotification, buildMemberStatusNotification, buildMembershipNotification, getMembershipStatusNotificationPlan, resolveWorkflowTarget } from "./workflowNotification.core.mjs";

test("membership events contain the request identity but no private message or note", () => {
  const request = { id: "request-1", first_name: "Mia", last_name: "Muster", internal_note: "intern", message: "privat" };
  for (const type of ["membership_created", "membership_assigned", "membership_forwarded", "membership_processing", "membership_completed", "membership_accepted", "membership_rejected", "membership_archived"]) {
    const event = buildMembershipNotification(type, request);
    assert.equal(event.type, type);
    assert.match(event.message, /Mia Muster/);
    assert.doesNotMatch(JSON.stringify(event), /intern|privat/);
  }
});

test("financial events never put amounts methods or internal notes into the notification", () => {
  const contribution = { id: "c-1", playerDisplayName: "Max Muster", amountDue: "999.00", paymentMethod: "cash", internalNotes: "secret" };
  for (const type of ["membership_payment_created", "membership_payment_updated", "membership_payment_received", "membership_payment_confirmed", "membership_payment_overdue", "membership_payment_deleted"]) {
    const event = buildContributionNotification(type, contribution);
    assert.match(event.message, /Max Muster/);
    assert.doesNotMatch(JSON.stringify(event), /999|cash|secret/);
    assert.equal(event.targetUrl, "/admin/contributions/c-1");
  }
});

test("member status messages shown to trainers contain no contribution information", () => {
  const player = { id: "p-1", first_name: "Max", last_name: "Muster" };
  for (const type of ["member_activated", "member_deactivated", "member_archived"]) {
    const event = buildMemberStatusNotification(type, player, { teamSeasonId: "ts-1", detailOnly: type === "member_archived" });
    assert.match(event.message, /Max Muster/);
    assert.doesNotMatch(event.message, /Betrag|Zahlung|Beitrag|offen/i);
  }
});

test("routing uses fach routes only with existing permissions and never unauthorized routes", () => {
  const contribution = buildContributionNotification("membership_payment_updated", { id: "c-1" });
  assert.equal(resolveWorkflowTarget({ permissionKeys: ["contributions.view"] }, contribution), "/admin/contributions/c-1");
  assert.equal(resolveWorkflowTarget({ permissionKeys: [] }, contribution), "/admin/notifications");
  const membership = buildMembershipNotification("membership_forwarded", { id: "m-1" });
  assert.equal(resolveWorkflowTarget({ permissionKeys: [] }, membership), "/admin/notifications");
  const archived = buildMemberStatusNotification("member_archived", { id: "p-1" }, { detailOnly: true });
  assert.equal(resolveWorkflowTarget({ permissionKeys: ["players.view"] }, archived), "/admin/notifications");
});

test("assigned membership opens the exact record while revoked access can fall back through its notification id", () => {
  const event = buildMembershipNotification("membership_assigned", { id: "m-1" }, { assignedRecipient: true });
  assert.equal(resolveWorkflowTarget({ permissionKeys: [] }, event), "/admin/membership-requests/m-1");
  assert.equal(event.metadata.assignedMembershipRequest, true);
});

test("trainer contribution events are detail-only while finance keeps the fach route", () => {
  const trainer = buildContributionNotification("membership_payment_received", { id: "c-1", playerDisplayName: "Max Muster" }, { detailOnly: true, audience: "trainer" });
  const finance = buildContributionNotification("membership_payment_received", { id: "c-1", playerDisplayName: "Max Muster" });
  assert.equal(trainer.targetUrl, "/admin/notifications");
  assert.equal(trainer.metadata.notificationDetailOnly, true);
  assert.equal(trainer.metadata.audience, "trainer");
  assert.equal(resolveWorkflowTarget({ permissionKeys: ["contributions.view"] }, finance), "/admin/contributions/c-1");
});

test("completion feedback exists only for a real transition to done", () => {
  assert.deepEqual(getMembershipStatusNotificationPlan("in_progress", "done", { assignedCoach: true }), { type: "membership_completed", recipientMode: "membership_policy" });
  assert.deepEqual(getMembershipStatusNotificationPlan("new", "done", { assignedCoach: true }), { type: "membership_completed", recipientMode: "membership_policy" });
  assert.equal(getMembershipStatusNotificationPlan("done", "done", { assignedCoach: true }), null);
  assert.deepEqual(getMembershipStatusNotificationPlan("new", "in_progress", { assignedCoach: true }), { type: "membership_processing", recipientMode: "target" });
  assert.equal(getMembershipStatusNotificationPlan("in_progress", "in_progress", { assignedCoach: true }), null);
});

test("completion text and metadata identify actor and context without contact data", () => {
  const event = buildMembershipNotification("membership_completed", { id: "m-1", first_name: "Max", last_name: "Muster", status: "done", year_group: "2014", teams: { name_de: "D2" }, email: "secret@example.test", phone: "123", internal_note: "secret" }, { actorName: "Trainer Swen", policyRecipient: true });
  assert.equal(event.title, "Mitgliedsanfrage erledigt");
  assert.match(event.message, /Max Muster.*Trainer Swen.*erledigt/);
  assert.equal(event.metadata.status, "done");
  assert.equal(event.metadata.teamName, "D2");
  assert.equal(event.metadata.yearGroup, "2014");
  assert.doesNotMatch(JSON.stringify(event), /secret@example|123|internal_note|secret/);
});

test("policy recipients open the record and everyone else remains in notification center", () => {
  const event = buildMembershipNotification("membership_completed", { id: "m-1" }, { policyRecipient: true });
  assert.equal(resolveWorkflowTarget({ canOpenMembershipRequest: true, permissionKeys: [] }, event), "/admin/membership-requests/m-1");
  assert.equal(resolveWorkflowTarget({ permissionKeys: [] }, event), "/admin/notifications");
});
