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
