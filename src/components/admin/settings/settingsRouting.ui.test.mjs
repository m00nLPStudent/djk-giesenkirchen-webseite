import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("settings page tabs render lists without embedded editors", () => {
  const pages = read("./tabs/PagesTab.js");
  const contacts = read("./tabs/ClubContactsTab.js");
  assert.match(pages, /<PageList/);
  assert.doesNotMatch(pages, /PageEditor|PageForm/);
  assert.match(contacts, /<ContactList/);
  assert.doesNotMatch(contacts, /ClubContactEditor|ContactForm/);
});

test("page list exposes shared desktop and mobile links", () => {
  const source = read("./components/PageList.js");
  for (const component of ["AdminModuleList", "AdminModuleCards", "AdminListHeader", "AdminListRow", "AdminListMobileCard", "AdminListChevron", "AdminStatusChip", "AdminModuleEmptyState"]) assert.match(source, new RegExp(component));
  assert.match(source, /\/admin\/settings\/pages\/edit\/\$\{page\.id\}/);
  assert.match(read("./tabs/PagesTab.js"), /\/admin\/settings\/pages\/new/);
});

test("contact list exposes avatar shared lists and standalone links", () => {
  const source = read("./components/ContactList.js");
  for (const component of ["CoachAvatar", "AdminModuleList", "AdminModuleCards", "AdminListRow", "AdminListMobileCard", "AdminModuleEmptyState"]) assert.match(source, new RegExp(component));
  assert.match(source, /\/admin\/settings\/contacts\/edit\/\$\{contact\.id\}/);
  assert.match(source, /break-all/);
});

test("all four standalone routes retain the server settings guard", () => {
  for (const path of ["../../../app/admin/settings/pages/new/page.js", "../../../app/admin/settings/pages/edit/[id]/page.js", "../../../app/admin/settings/contacts/new/page.js", "../../../app/admin/settings/contacts/edit/[id]/page.js"]) {
    const source = read(path);
    assert.match(source, /loadSettingsEditorRecord/);
    assert.match(source, /AdminModulePage/);
  }
  assert.match(read("./settingsEditorRoute.js"), /requiredPermission: "settings\.view"/);
});

test("CMS editor is German-only and English fields are absent from writes", () => {
  const form = read("./components/PageForm.js");
  const service = read("./settings.service.js");
  assert.match(form, /title_de|content_de|AdminRichTextEditor/);
  assert.doesNotMatch(form, /title_en|content_en|Titel \(EN\)|Inhalt \(EN\)/);
  const pagePayload = service.slice(service.indexOf("export function normalizePagePayload"), service.indexOf("export async function createPage"));
  assert.doesNotMatch(pagePayload, /title_en|content_en/);
});

test("deletes remain in danger zones and routes return to their overviews", () => {
  assert.match(read("./components/PageForm.js"), /AdminDangerZone/);
  assert.match(read("./components/ContactForm.js"), /AdminDangerZone/);
  assert.match(read("./SettingsPageEditorView.js"), /router\.replace\("\/admin\/settings\?tab=pages"\)/);
  assert.match(read("./SettingsContactEditorView.js"), /router\.replace\("\/admin\/settings\?tab=contacts"\)/);
});
