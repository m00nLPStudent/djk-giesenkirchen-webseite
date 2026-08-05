import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const service = await read("../notifications.service.js");
const loader = await read("./notificationMonitoring.loader.js");
const moduleSource = await read("./NotificationMonitoringModule.js");
const page = await read("../../../../app/admin/system/notifications/page.js");

test("central notification writes await persistent structured audit events", () => {
  assert.match(service, /recordNotificationMonitoringEvent/);
  assert.match(service, /await recordNotificationMonitoringEvent/);
  assert.match(service, /notification_insert_failed/);
  assert.match(service, /idempotency_duplicate/);
  assert.doesNotMatch(service, /console\.log/);
});

test("monitoring reads only the SQL audit snapshot and never writes or retries", () => {
  assert.match(loader, /rpc\("load_notification_audit_monitoring"/);
  assert.doesNotMatch(loader, /from\("notifications"\)/);
  assert.doesNotMatch(loader, /\.insert\(|\.update\(|\.delete\(/);
  assert.doesNotMatch(moduleSource, /createNotification|createNotificationsOnce|onClick=.*retry/i);
  assert.match(moduleSource, /disabled/);
  assert.match(moduleSource, /Retry ist vorbereitet/);
});

test("persistent history includes the 90 day range and has no runtime buffer wording", () => {
  assert.match(moduleSource, /value="ninety"/);
  assert.doesNotMatch(moduleSource, /nicht erfassbar|flüchtige Laufzeit/);
});

test("route is force dynamic and guarded exclusively by superadmin role", () => {
  assert.match(page, /dynamic = "force-dynamic"/);
  assert.match(page, /role\?\.key === "superadmin"/);
  assert.match(page, /superadmin-required/);
});

test("dashboard uses shared responsive design-system primitives", () => {
  for (const marker of ["AdminModuleHeader", "AdminModuleSearch", "AdminModuleFilters", "AdminModuleList", "AdminModuleCards", "AdminStatusChip"]) assert.match(moduleSource, new RegExp(marker));
});
