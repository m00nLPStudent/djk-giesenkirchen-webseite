import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("settings page uses the shared module page and prescribed header", () => {
  const source = read("../../../app/admin/settings/page.js");
  assert.match(source, /AdminModulePage/);
  assert.match(source, /AdminModuleHeader/);
  assert.match(source, /Vereinsdaten, Systemeinstellungen und Verwaltung konfigurieren\./);
  assert.doesNotMatch(source, /AdminPageHeader/);
});

test("settings tabs and empty states use shared design-system primitives", () => {
  assert.match(read("./components/SettingsToolbar.js"), /AdminActionBar/);
  assert.match(read("./components/SettingsToolbar.js"), /AdminButton/);
  assert.match(read("./components/SettingsSelectionList.js"), /AdminModuleEmptyState/);
  assert.doesNotMatch(read("./components/SettingsTabs.js"), /TabNavigation/);
});

test("existing destructive settings actions are enclosed by danger zones", () => {
  for (const path of [
    "./components/ContactForm.js",
    "./components/MembershipRecipientForm.js",
    "./components/PageForm.js",
  ]) {
    assert.match(read(path), /AdminDangerZone/);
  }
});

test("membership request permission gates and handlers remain wired", () => {
  const source = read("./components/MembershipRequestDetail.js");
  assert.match(source, /membership_requests\.forward/);
  assert.match(source, /membership_requests\.edit/);
  assert.match(source, /onForward/);
  assert.match(source, /onMarkDone/);
});

test("no settings data or action layer was changed by the UI migration", () => {
  const page = read("../../../app/admin/settings/page.js");
  assert.match(page, /requiredPermission: "settings\.view"/);
  assert.match(page, /membership_requests/);
  assert.match(page, /Promise\.all/);
});
