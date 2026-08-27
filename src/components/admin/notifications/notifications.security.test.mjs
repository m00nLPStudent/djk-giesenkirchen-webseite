import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const repository = await readFile(new URL("./notifications.repository.js", import.meta.url), "utf8");
const service = await readFile(new URL("./notifications.service.js", import.meta.url), "utf8");
const actions = await readFile(new URL("../../../app/admin/notifications/actions.js", import.meta.url), "utf8");
const rls = await readFile(new URL("../../../../docs/sql/b15-18a-notifications-rls-proposal.sql", import.meta.url), "utf8");

test("every user mutation and read is scoped by recipient_user_id", () => {
  const scopedOperations = repository.match(/\.eq\("recipient_user_id", recipientUserId\)/g) || [];
  assert.equal(scopedOperations.length, 6);
  assert.match(repository, /deleteSelectedNotificationsForUser[\s\S]*\.in\("id", notificationIds\)\.eq\("recipient_user_id", userId\)/);
});

test("the central API exposes all required operations", () => {
  for (const name of ["createNotification", "createNotifications", "loadNotifications", "loadUnreadNotifications", "loadUnreadCount", "markAsRead", "markAllAsRead", "deleteNotification", "deleteSelectedNotifications", "deleteAllRead"]) {
    assert.match(service, new RegExp(`export (?:async )?function ${name}\\b`));
  }
});

test("server actions always derive the recipient from authenticated context", () => {
  assert.match(actions, /userId: auth\.userId/);
  assert.doesNotMatch(actions, /recipientUserId/);
  assert.match(actions, /deleteSelectedNotificationsAction\(ids\)[\s\S]*normalizeNotificationIds\(ids\)[\s\S]*userId: context\.userId/);
  assert.match(actions, /deletedCount/);
});

test("RLS grants no cross-user or authenticated insert access", () => {
  assert.match(rls, /recipient_user_id = auth\.uid\(\)/g);
  assert.doesNotMatch(rls, /FOR INSERT TO authenticated/i);
  assert.doesNotMatch(rls, /USING\s*\(\s*true\s*\)/i);
  assert.match(rls, /GRANT UPDATE \(is_read, read_at\)/);
});
