import test from "node:test";
import assert from "node:assert/strict";
import {
  filterNotifications,
  formatNotificationAge,
  getNotificationTypes,
  normalizeNotificationTarget,
  normalizeNotificationType,
} from "./notifications.core.mjs";

const items = [
  { id: "old", title: "Spieler", message: "Zugeordnet", type: "player_assigned", isRead: true, createdAt: "2026-08-01T10:00:00Z" },
  { id: "new", title: "News", message: "Freigabe nötig", type: "news_review_requested", isRead: false, createdAt: "2026-08-03T10:00:00Z" },
];

test("normalizes future notification types without a hardcoded allowlist", () => {
  assert.equal(normalizeNotificationType(" Future / Custom Event "), "future_custom_event");
  assert.equal(normalizeNotificationType(""), "future_custom");
});

test("accepts internal targets and rejects external or protocol-relative targets", () => {
  assert.equal(normalizeNotificationTarget("/admin/news/1"), "/admin/news/1");
  assert.equal(normalizeNotificationTarget("https://example.org"), "/admin/notifications");
  assert.equal(normalizeNotificationTarget("//example.org"), "/admin/notifications");
});

test("filters by recipient-visible DTO properties and sorts newest first", () => {
  assert.deepEqual(filterNotifications(items).map(({ id }) => id), ["new", "old"]);
  assert.deepEqual(filterNotifications(items, { status: "unread" }).map(({ id }) => id), ["new"]);
  assert.deepEqual(filterNotifications(items, { type: "player_assigned", search: "zugeordnet" }).map(({ id }) => id), ["old"]);
});

test("derives filter types dynamically and formats relative age", () => {
  assert.deepEqual(getNotificationTypes(items), ["news_review_requested", "player_assigned"]);
  assert.equal(formatNotificationAge("2026-08-03T09:59:00Z", new Date("2026-08-03T10:00:00Z")), "vor 1 Min.");
});
