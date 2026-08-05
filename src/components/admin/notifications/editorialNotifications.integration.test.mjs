import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const actions = await read("../../../app/admin/events/actions.js");
const editor = await read("../events/forms/EventEditorForm.js");
const service = await read("./editorialNotifications.service.js");
const newsActions = await read("../../../app/admin/news/actions.js");
const pageService = await read("../settings/settings.service.js");

test("event mutation finishes before notification delivery and keeps notification failure best effort", () => {
  assert.ok(actions.indexOf('.from("events").update') < actions.indexOf("const notification = await notifyEventWorkflow"));
  assert.match(actions, /logEditorialNotificationFailure/);
  assert.match(actions, /events\.edit/);
  assert.match(actions, /events\.create/);
});

test("event editor uses the authorized server mutation and performs no client notification insert", () => {
  assert.match(editor, /saveEventWithNotificationAction/);
  assert.doesNotMatch(editor, /createNotification|from\(["']notifications/);
});

test("recipients reuse current season and the existing batched team resolver", () => {
  assert.match(service, /loadCurrentSeasonResolution/);
  assert.match(service, /resolveTeamNotificationRecipients/);
  assert.match(service, /createNotificationsOnce/);
  assert.doesNotMatch(service, /for[\s\S]{0,150}await/);
});

test("news and pages expose no stable creator reference and are not guessed from display names", () => {
  assert.match(newsActions, /select\("id, author"\)/);
  assert.doesNotMatch(newsActions, /created_by|author_profile_id|notifyEventWorkflow/);
  assert.doesNotMatch(pageService, /created_by|author_profile_id|createNotification/);
});
