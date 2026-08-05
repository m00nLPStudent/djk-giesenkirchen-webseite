import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const actions = await read("../../../app/admin/teams/training/actions.js");
const service = await read("./trainingNotifications.service.js");
const timesManager = await read("../teams/components/TrainingTimesManager.js");
const exceptionsManager = await read("../teams/components/TrainingExceptionsManager.js");
const legacyService = await read("../teams/services/training.service.js");
const virtualTraining = await read("../../../lib/events/virtualTraining.js");
const eventLoader = await read("../../../lib/events/eventLoader.js");

test("all six mutations are authenticated permission and team-scope guarded", () => {
  for (const name of ["createTrainingTimeAction", "updateTrainingTimeAction", "deleteTrainingTimeAction", "createTrainingExceptionAction", "updateTrainingExceptionAction", "deleteTrainingExceptionAction"]) assert.match(actions, new RegExp(`export async function ${name}`));
  assert.match(actions, /requiredPermission: "teams\.edit"/);
  assert.match(actions, /loadServerTeamScopeContext/);
  assert.match(actions, /canAccessTeamOnServer/);
});

test("mutation and postcheck happen before best-effort notification", () => {
  assert.ok(actions.indexOf('.from("team_training_times").update') < actions.indexOf('"training-time-updated"'));
  assert.ok(actions.indexOf('const postcheck = await state.auth.supabaseServer.from("team_training_times")') < actions.indexOf('"training-time-removed"'));
  assert.ok(actions.indexOf('.from("team_training_exceptions").update') < actions.indexOf('"training-exception-updated"'));
  assert.match(actions, /logTrainingNotificationFailure/);
});

test("client forms call server actions and legacy browser service is read-only", () => {
  assert.match(timesManager, /createTrainingTimeAction/);
  assert.match(timesManager, /updateTrainingTimeAction/);
  assert.match(timesManager, /deleteTrainingTimeAction/);
  assert.match(exceptionsManager, /createTrainingExceptionAction/);
  assert.match(exceptionsManager, /updateTrainingExceptionAction/);
  assert.match(exceptionsManager, /deleteTrainingExceptionAction/);
  assert.doesNotMatch(legacyService, /\.insert\(|\.update\(|\.delete\(/);
});

test("delivery reuses the existing team resolver central idempotency and actor exclusion", () => {
  assert.match(service, /resolveTeamNotificationRecipients/);
  assert.match(service, /createNotificationsOnce/);
  assert.match(service, /recipient\.userId !== actorUserId/);
  assert.doesNotMatch(service, /for[\s\S]{0,120}await/);
});

test("reads and virtual occurrence generation never create notifications", () => {
  for (const source of [legacyService, virtualTraining, eventLoader]) assert.doesNotMatch(source, /createNotification|notifyTrainingMutation|createNotificationsOnce/);
});

test("server mutations retain focused revalidation outside notification delivery", () => {
  assert.match(actions, /revalidatePath\("\/admin\/events"\)/);
  assert.match(actions, /revalidatePath\(`\/admin\/teams\/\$\{teamId\}`\)/);
  assert.match(actions, /revalidatePublicContent\("events"\)/);
  assert.doesNotMatch(service, /revalidate/);
});
