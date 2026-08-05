import test from "node:test";
import assert from "node:assert/strict";
import { buildTrainingExceptionNotification, buildTrainingTimeNotification, resolveTrainingTarget } from "./trainingNotification.core.mjs";

const context = { teamId: "team-1", teamSeasonId: "ts-1", teamName: "D2", seasonId: "s-1", seasonLabel: "2026/27" };
const slot = { id: "slot-1", weekday: 1, start_time: "17:00:00", end_time: "18:45:00", location_name: "Kunstrasen", updated_at: "2026-08-05" };

test("training time builders produce understandable German messages", () => {
  const created = buildTrainingTimeNotification({ action: "created", type: "event_created", changedFields: ["created"] }, slot, context);
  assert.equal(created.title, "Neue Trainingszeit");
  assert.match(created.message, /D2.*montags.*17:00.*18:45/);
  assert.equal(resolveTrainingTarget({ permissionKeys: ["teams.view"] }, created), "/admin/teams/team-1");
});

test("removed slots always stay in notification detail", () => {
  const removed = buildTrainingTimeNotification({ action: "removed", type: "event_cancelled", changedFields: ["removed"] }, slot, { ...context, previous: slot });
  assert.equal(removed.metadata.notificationDetailOnly, true);
  assert.equal(resolveTrainingTarget({ permissionKeys: ["teams.view"] }, removed), "/admin/notifications");
});

test("exception builders distinguish cancellation movement and reversal", () => {
  const exception = { id: "ex-1", exception_date: "2026-09-12", exception_type: "cancelled", updated_at: "2026-08-05" };
  const cancelled = buildTrainingExceptionNotification({ action: "cancelled", type: "event_cancelled", changedFields: ["created"] }, exception, context);
  const moved = buildTrainingExceptionNotification({ action: "moved", type: "event_updated", changedFields: ["exception_type"] }, { ...exception, exception_type: "moved" }, context);
  const reverted = buildTrainingExceptionNotification({ action: "reverted", type: "event_updated", changedFields: ["removed"] }, exception, { ...context, previous: exception });
  assert.equal(cancelled.title, "Training abgesagt");
  assert.equal(moved.title, "Training verschoben");
  assert.equal(reverted.title, "Training findet wieder statt");
  assert.equal(reverted.metadata.notificationDetailOnly, true);
});

test("training metadata excludes notes contacts and complete form data", () => {
  const result = buildTrainingTimeNotification({ action: "created", type: "event_created", changedFields: ["created"] }, { ...slot, note: "privat" }, context);
  for (const key of ["note", "email", "phone", "medical", "payload"]) assert.equal(key in result.metadata, false);
});
