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

test("settings keeps its guard and no longer loads membership data", () => {
  const page = read("../../../app/admin/settings/page.js");
  assert.match(page, /requiredPermission: "settings\.view"/);
  assert.doesNotMatch(page, /membership_requests|membership_request_recipients/);
  assert.match(page, /Promise\.all/);
});

test("club data colors and social links use compact shared detail sections", () => {
  const source = read("./panels/ClubSettingsPanel.js");
  for (const component of ["AdminDetailLayout", "AdminDetailHeader", "AdminInformationSection", "AdminInformationRow", "AdminActionBar", "AdminButton"]) assert.match(source, new RegExp(component));
  for (const field of ["club_name", "color_primary", "color_secondary", "color_accent", "website_url", "social_facebook", "social_instagram", "social_youtube", "social_tiktok"]) assert.match(source, new RegExp(field));
  assert.match(source, /xl:grid-cols-2/);
  assert.doesNotMatch(source, /FormSection|columns=\{3\}/);
});

test("contacts use responsive shared lists and standalone editor routes", () => {
  const list = read("./components/ContactList.js");
  const tab = read("./tabs/ClubContactsTab.js");
  for (const component of ["AdminModuleList", "AdminModuleCards", "AdminListHeader", "AdminListRow", "AdminListMobileCard", "AdminListChevron", "AdminModuleEmptyState", "AdminStatusChip"]) assert.match(list, new RegExp(component));
  assert.match(tab, /\/admin\/settings\/contacts\/new/);
  assert.doesNotMatch(tab, /ClubContactEditor|ContactForm|grid-cols/);
  assert.match(list, /\/admin\/settings\/contacts\/edit\/\$\{contact\.id\}/);
});

test("contact detail uses shared information image action and danger primitives", () => {
  const source = read("./components/ContactForm.js");
  for (const component of ["AdminDetailLayout", "AdminDetailHeader", "AdminInformationSection", "AdminInformationRow", "AdminImagePreview", "AdminActionBar", "AdminButton", "AdminDangerZone", "AdminStatusChip"]) assert.match(source, new RegExp(component));
  assert.match(source, /xl:grid-cols-2/);
  assert.match(source, /AdminMediaPicker/);
  assert.doesNotMatch(source, /FormSection/);
});
