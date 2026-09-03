import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), "utf8");
const shell = read("../layout/AdminShell.js");
const layout = read("../layout/AdminLayout.js");
const header = read("../layout/AdminHeader.js");
const drawer = read("./AdminMobileNavigationDrawer.js");
const permissionConfig = read("../../../lib/admin-auth/adminPermissionConfig.js");

test("shell always loads and renders the canonical navigation", () => {
  assert.match(layout, /await loadAdminNavigation\("\/admin"\)/);
  assert.match(shell, /<AdminNavigationExperience/);
  assert.doesNotMatch(`${layout}\n${shell}`, /HORIZONTAL_NAVIGATION|horizontalNavigationEnabled/);
});

test("legacy sidebar and reserved sidebar grid are absent from the shell", () => {
  assert.doesNotMatch(shell, /AdminSidebar|260px|grid-cols-\[260px/);
  assert.match(shell, /mx-auto w-full max-w-7xl/);
});

test("the header is the single mobile navigation trigger", () => {
  assert.equal((`${header}\n${drawer}`).match(/CMS-Navigation öffnen/g)?.length, 1);
  assert.match(header, /aria-expanded=\{navigationOpen\}/);
  assert.match(header, /aria-controls="admin-mobile-navigation"/);
  assert.doesNotMatch(drawer, /<Menu|CMS-Navigation öffnen/);
});

test("the controlled drawer retains dialog, focus, escape and body-lock semantics", () => {
  assert.match(drawer, /id="admin-mobile-navigation"/);
  assert.match(drawer, /aria-modal="true"/);
  assert.match(drawer, /event\.key === "Escape"/);
  assert.match(drawer, /document\.body\.style\.overflow = "hidden"/);
  assert.match(drawer, /opener\?\.focus\(\)/);
});

test("department route guard and navigation share board.view", () => {
  assert.match(permissionConfig, /buildRule\("\/admin\/department", "board\.view"/);
  assert.match(permissionConfig, /"\/admin\/department": "board\.view"/);
  assert.doesNotMatch(permissionConfig, /\/admin\/department[^\n]+system\.view/);
});
