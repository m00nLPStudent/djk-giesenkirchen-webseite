import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const playerAction = await readFile(new URL("../../../app/admin/players/actions.js", import.meta.url), "utf8");
const coachAction = await readFile(new URL("../../../app/admin/coaches/actions.js", import.meta.url), "utf8");
const teamAction = await readFile(new URL("../../../app/admin/teams/actions.js", import.meta.url), "utf8");
const integration = await readFile(new URL("./teamAssignmentNotifications.service.js", import.meta.url), "utf8");
const recipients = await readFile(new URL("./teamNotificationRecipients.repository.js", import.meta.url), "utf8");
const notificationService = await readFile(new URL("./notifications.service.js", import.meta.url), "utf8");

test("player notifications run only after successful save and archive postcheck", () => {
  assert.ok(playerAction.indexOf("if (saveResult.error)") < playerAction.indexOf("const notificationResult = await notifyPlayerAssignmentChange"));
  assert.ok(playerAction.indexOf("const result = await archivePlayer") < playerAction.lastIndexOf("notifyPlayerAssignmentChange"));
});

test("coach notifications run only after successful save and archive postcheck", () => {
  assert.ok(coachAction.indexOf("if (saveResult.error)") < coachAction.indexOf("const notificationResult = await notifyCoachAssignmentChange"));
  assert.ok(coachAction.indexOf("const result = await archiveCoach") < coachAction.lastIndexOf("notifyCoachAssignmentChange"));
});

test("team editor compares roster snapshots only after the complete save succeeds", () => {
  assert.match(teamAction, /loadTeamRosterNotificationSnapshot/);
  assert.ok(teamAction.indexOf("if (result?.error)") < teamAction.indexOf("const notificationResult = await notifyTeamRosterChange"));
});

test("notification delivery failures are logged and never roll back domain writes", () => {
  assert.match(integration, /console\.error\("\[assignment-notification\]"/);
  assert.doesNotMatch(integration, /rollback/i);
});

test("recipients use active seasonal coach links and fixed admin_profile_id links", () => {
  assert.match(recipients, /coach_team_seasons/);
  assert.match(recipients, /\.eq\("is_active", true\)/);
  assert.match(recipients, /admin_profile_id/);
  assert.doesNotMatch(recipients, /first_name.*last_name|\.eq\("email"/);
});

test("recipient and permission data is loaded in batches without per-row queries", () => {
  assert.match(recipients, /\.in\("team_season_id", ids\)/);
  assert.match(recipients, /\.in\("id", coachIds\)/);
  assert.match(recipients, /Promise\.all/);
});

test("central notification API performs bounded retry deduplication", () => {
  assert.match(notificationService, /createNotificationsOnce/);
  assert.match(notificationService, /idempotencyKey/);
  assert.match(notificationService, /5 \* 60 \* 1000/);
});

test("existing permission and scope guards remain before mutation", () => {
  assert.match(playerAction, /canEditPlayerOnServer/);
  assert.match(playerAction, /canCreatePlayerOnServer/);
  assert.match(coachAction, /canEditCoachOnServer/);
  assert.match(coachAction, /outOfScopeTarget/);
});
