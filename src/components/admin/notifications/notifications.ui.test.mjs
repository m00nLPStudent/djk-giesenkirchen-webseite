import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const moduleSource = await readFile(new URL("./NotificationsModule.js", import.meta.url), "utf8");
const bellSource = await readFile(new URL("../topbar/NotificationBell.js", import.meta.url), "utf8");
const pageSource = await readFile(new URL("../../../app/admin/notifications/page.js", import.meta.url), "utf8");
const dtoSource = await readFile(new URL("./notification.dto.js", import.meta.url), "utf8");
const detailSource = await readFile(new URL("./NotificationDetailCard.js", import.meta.url), "utf8");

test("notification center uses shared responsive module primitives", () => {
  for (const component of ["AdminModuleHeader", "AdminModuleSearch", "AdminModuleFilters", "AdminModuleList", "AdminModuleCards", "AdminModuleEmptyState"]) assert.match(moduleSource, new RegExp(component));
  assert.match(moduleSource, /xl:block/);
  assert.match(moduleSource, /xl:hidden/);
});

test("bell exposes an accessible dropdown without interval polling", () => {
  assert.match(bellSource, /aria-expanded/);
  assert.match(bellSource, /aria-controls="admin-notification-popover"/);
  assert.match(bellSource, /Alle als gelesen|Alle gelesen/);
  assert.match(bellSource, /\/admin\/notifications/);
  assert.doesNotMatch(bellSource, /setInterval|setTimeout/);
});

test("page is dynamic and authenticated", () => {
  assert.match(pageSource, /force-dynamic/);
  assert.match(pageSource, /assertAdminActionPermission/);
});

test("removed events target an id-scoped notification-center detail", () => {
  assert.match(dtoSource, /notificationDetailOnly/);
  assert.match(dtoSource, /accessLost/);
  assert.match(dtoSource, /\/admin\/notifications\?notification=/);
  assert.match(dtoSource, /encodeURIComponent\(row\.id\)/);
});

test("selected details stay scoped to the current user's loaded notifications and become read", () => {
  assert.match(pageSource, /\.find\(\(item\) => item\.id === requestedId\)/);
  assert.match(pageSource, /markAsRead\(\{ db: auth\.supabaseServer, userId: auth\.userId, id: selected\.id \}\)/);
  assert.match(moduleSource, /item\.id === selectedId/);
  assert.match(moduleSource, /ring-2 ring-red-500\/45/);
  assert.match(detailSource, /AdminInformationSection/);
  assert.match(detailSource, /item\.message/);
});

test("bulk selection is limited to visible rows and requires confirmation", () => {
  for (const marker of ["selectedIds", "toggleAllVisible", "Alle auswählen", "Alle abwählen", "ausgewählt", "Ausgewählte löschen", "window.confirm", "deleteSelectedNotificationsAction"]) assert.match(moduleSource, new RegExp(marker));
  assert.match(moduleSource, /toggleVisibleNotificationSelection\(current, filtered\)/);
  assert.match(moduleSource, /getVisibleNotificationIds\(filtered\)/);
  assert.match(moduleSource, /selectedIds\.filter\(\(id\) => visibleIds\.has\(id\)\)/);
  assert.match(moduleSource, /disabled=\{!selectedCount \|\| pending\}/);
});

test("desktop and mobile rows expose accessible selection controls", () => {
  assert.match(moduleSource, /label: "Auswahl"/);
  assert.match(moduleSource, /type="checkbox"/g);
  assert.match(moduleSource, /className="h-5 w-5 accent-red-500"/);
  assert.match(moduleSource, /xl:hidden/);
  assert.match(moduleSource, /xl:block/);
});

test("single deletion keeps selection state consistent while delete-all-read stays out of the UI", () => {
  assert.match(moduleSource, /selectedId !== id/);
  assert.match(moduleSource, /setSelectedIds\(\[\]\)/);
  assert.doesNotMatch(moduleSource, /Gelesene löschen|deleteAllReadNotificationsAction|removeRead/);
});

test("header is action-free and mark-all-read lives in the compact bulk toolbar", () => {
  assert.doesNotMatch(moduleSource, /AdminModuleHeader[^\n]*actions=/);
  assert.match(moduleSource, /onMarkAll=\{markAll\}/);
  assert.match(moduleSource, /<AdminButton onClick=\{onMarkAll\}>Alle als gelesen markieren<\/AdminButton>/);
  assert.match(moduleSource, /flex flex-col gap-2 sm:flex-row/);
});

test("type filter and table use central German labels with a subtle technical key", () => {
  assert.match(moduleSource, /getNotificationTypeLabel\(value\)/);
  assert.match(moduleSource, /getNotificationTypeLabel\(item\.type\)/);
  assert.match(moduleSource, /<code[^>]*>\{item\.type\}<\/code>/);
  assert.match(moduleSource, /getNotificationTypes\(items\)/);
});
