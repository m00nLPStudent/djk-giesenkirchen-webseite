import test from "node:test";
import assert from "node:assert/strict";
import { buildActiveTypes, buildNotificationHealth, buildTopErrors, createPersistedAuditEntry, filterMonitoringEntries } from "./notificationMonitoring.core.mjs";

const success = createPersistedAuditEntry({ id: "n1", recipient_user_id: "user-1", actor_user_id: "user-2", notification_type: "event_created", status: "success", successful_count: 1, recipient_count: 1, target_url: "/admin/teams/1", created_at: "2026-08-05T10:00:00Z", metadata: { recipientAnalysis: { afterDedupe: 1 } } });
const failed = { id: "r1", source: "runtime", timestamp: "2026-08-05T11:00:00Z", type: "event_created", status: "failed", actorId: "user-2", recipientId: "user-1", recipientCount: 1, afterDedupeCount: 1, successCount: 0, failedCount: 1, duplicateCount: 0, skippedCount: 0, actorRemovedCount: 0, route: "/admin/teams/1", errorClass: "notification_insert_failed" };
const duplicate = { ...failed, id: "r2", type: "member_activated", status: "duplicate", failedCount: 0, duplicateCount: 1, skippedCount: 1, errorClass: "idempotency_duplicate" };

test("persisted notifications map to privacy-safe successful audit rows", () => {
  assert.equal(success.status, "success");
  assert.equal(success.successCount, 1);
  assert.equal(success.recipientId, "user-1");
  assert.equal("message" in success, false);
});

test("search status and time range filters work together", () => {
  const result = filterMonitoringEntries([success, failed, duplicate], { search: "event_created", status: "failed", range: "seven", now: new Date("2026-08-06T00:00:00Z") });
  assert.deepEqual(result.map((item) => item.id), ["r1"]);
  assert.equal(filterMonitoringEntries([success], { range: "today", now: new Date("2026-08-07T00:00:00Z") }).length, 0);
});

test("health summary aggregates persistent audit counts", () => {
  const health = buildNotificationHealth([success, failed, duplicate]);
  assert.equal(health.successful, 1);
  assert.equal(health.failures, 1);
  assert.equal(health.duplicates, 1);
  assert.equal(health.successful, 1);
});

test("top errors and active types aggregate without inventing historical failures", () => {
  assert.deepEqual(buildTopErrors([success, failed, duplicate]).map((item) => item.errorClass), ["notification_insert_failed", "idempotency_duplicate"]);
  const type = buildActiveTypes([success, failed]).find((item) => item.type === "event_created");
  assert.equal(type.count, 1);
  assert.equal(type.failures, 1);
  assert.equal(type.errorRate, 0.5);
});
