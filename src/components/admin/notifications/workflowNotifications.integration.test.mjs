import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const service = await read("./workflowNotifications.service.js");
const repository = await read("./workflowNotificationRecipients.repository.js");
const contributionActions = await read("../../../app/admin/contributions/actions.js");
const membershipActions = await read("../../../app/admin/membership-requests/actions.js");
const publicActions = await read("../../../app/membership/actions.js");
const playerActions = await read("../../../app/admin/players/actions.js");
const recordAccess = await read("../membership/membershipRequestRecordAccess.service.js");
const recordAccessCore = await read("../membership/membershipRequestRecordAccess.core.mjs");
const membershipDetailPage = await read("../../../app/admin/membership-requests/[id]/page.js");
const assignedEditor = await read("../membership/AssignedMembershipRequestEditor.js");
const notificationDetail = await read("./NotificationDetailCard.js");
const responsibilityCore = await read("../../../lib/membership/membershipResponsibility.core.mjs");

test("all workflow delivery reuses central idempotent notifications and excludes the actor", () => {
  assert.match(service, /createNotificationsOnce/);
  assert.match(service, /item\.userId !== actorUserId/);
  assert.doesNotMatch(service, /\.from\("notifications"\)/);
});

test("recipient relations are loaded in fixed batches without a per-recipient query", () => {
  assert.match(repository, /Promise\.all/);
  for (const table of ["admin_profiles", "admin_user_roles", "admin_roles", "admin_role_permissions", "admin_permissions"]) assert.match(repository, new RegExp(table));
  assert.doesNotMatch(repository, /for[\s\S]{0,200}await/);
  assert.match(repository, /admin_profiles[\s\S]*\.eq\("is_active", true\)/);
  assert.match(repository, /admin_roles[\s\S]*\.eq\("is_active", true\)/);
  assert.doesNotMatch(repository, /\.first\(|\.limit\(1\)/);
  assert.match(responsibilityCore, /new Map\(\(candidates \|\| \[\]\)/);
});

test("finance recipients are permission-bound and limited to approved roles", () => {
  assert.match(service, /contributions\.view/);
  for (const role of ["superadmin", "kassierer", "vorstand"]) assert.match(service, new RegExp(role));
  assert.doesNotMatch(service, /trainer[\s\S]{0,80}contributions\.view/);
});

test("domain writes complete before notifications and notification failures do not roll them back", () => {
  assert.ok(contributionActions.indexOf("const result = await executor") < contributionActions.indexOf("await notifyContributionWorkflow"));
  assert.ok(membershipActions.indexOf("await saveMembershipRequestStatus") < membershipActions.indexOf("await notifyMembershipWorkflow"));
  assert.ok(publicActions.indexOf("await submitMembershipRequest") < publicActions.indexOf("await notifyMembershipWorkflow"));
  assert.match(service, /logWorkflowNotificationFailure/);
});

test("existing permissions guard membership mutations and successful player status changes", () => {
  assert.match(responsibilityCore, /membership_requests\.edit/);
  assert.match(responsibilityCore, /membership_requests\.forward/);
  assert.match(playerActions, /member_activated/);
  assert.match(playerActions, /member_deactivated/);
  assert.match(playerActions, /member_archived/);
});

test("assigned trainer membership access is record-bound and revocation falls back to notification center", () => {
  assert.match(recordAccess, /admin_profile_id/);
  assert.match(recordAccessCore, /forwarded_to_type/);
  assert.match(recordAccess, /isMembershipRequestAssignedToCoach/);
  assert.doesNotMatch(recordAccess, /membership_requests\.view["']\s*\)/);
  assert.match(membershipDetailPage, /\/admin\/notifications\?notification=/);
  assert.doesNotMatch(membershipDetailPage, /unauthorized/);
});

test("trainer contribution recipients use active current-season team batches and detail-only content", () => {
  assert.match(service, /loadCurrentSeasonResolution/);
  assert.match(service, /loadPlayerCurrentSeasonAssignmentRows/);
  assert.match(service, /resolveTeamNotificationRecipients/);
  assert.match(service, /detailOnly: true, audience: "trainer"/);
});

test("assigned trainer save returns only to the fixed notification-center target", () => {
  assert.match(assignedEditor, /router\.push\(notificationId \? `\/admin\/notifications\?notification=/);
  assert.match(assignedEditor, /encodeURIComponent\(notificationId\)/);
  assert.doesNotMatch(assignedEditor, /returnTo|redirectUrl|window\.location/);
  assert.ok(assignedEditor.indexOf("if (result.error)") < assignedEditor.indexOf("router.push"));
});

test("trainer completion feeds the existing membership policy after successful mutation", () => {
  assert.match(membershipActions, /getMembershipStatusNotificationPlan/);
  assert.ok(membershipActions.indexOf("await saveMembershipRequestStatus") < membershipActions.indexOf("await notifyMembershipWorkflow"));
  assert.match(service, /recipientMode === "membership_policy"/);
  assert.match(service, /resolveMembershipNotificationRecipients/);
  assert.match(service, /uniqueWithoutActor/);
});

test("public submit uses the persisted request identity and keeps notification failure best effort", () => {
  assert.match(publicActions, /id: result\.data\?\.id, created_at: result\.data\?\.created_at/);
  assert.doesNotMatch(publicActions, /randomUUID|recipientUserId|roleKeys/);
  assert.match(publicActions, /try[\s\S]*notifyMembershipWorkflow[\s\S]*catch \(notificationError\)/);
});

test("new membership recipients receive the record link but record access stays server-authorized", () => {
  assert.match(service, /type === "membership_created" \|\| recipientMode === "membership_policy"/);
  assert.match(recordAccess, /canAccessMembershipRequestType/);
  assert.match(membershipDetailPage, /resolveMembershipRequestRecordAccess\(id\)/);
});

test("notification fallback renders the structured completion context", () => {
  for (const label of ["Bearbeitungsstatus", "Erledigt durch", "Erledigt am", "Mannschaft", "Jahrgang"]) {
    assert.match(notificationDetail, new RegExp(label));
  }
});
