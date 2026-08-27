import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const page = read("../../../app/admin/news/page.js");
const overview = read("./AdminNewsList.js");
const filters = read("./components/NewsFilters.js");
const card = read("./components/NewsCard.js");
const empty = read("./components/NewsEmptyState.js");
const editPage = read("../../../app/admin/news/edit/[id]/page.js");
const newPage = read("../../../app/admin/news/new/page.js");
const editor = read("./forms/NewsEditorForm.js");

test("news query and existing status calculations remain unchanged", () => {
  assert.match(page, /\.from\("news"\)/);
  assert.match(page, /\.select\("\*, football_team:football_team_id\(name_de\)"\)/);
  for (const status of ["entwurf", "geplant", "veroeffentlicht"]) assert.ok(page.includes(status));
});

test("overview uses shared header search summary and collapsed filters", () => {
  for (const primitive of ["AdminModulePage", "AdminModuleHeader", "AdminModuleSearch", "NewsStats"]) assert.ok(overview.includes(primitive));
  assert.match(overview, /News erstellen, bearbeiten und veröffentlichen\./);
  assert.match(overview, /\+ Neue News/);
  assert.match(filters, /AdminModuleFilters/);
  assert.doesNotMatch(filters, /defaultExpanded=\{true\}/);
});

test("news list switches at xl between table and fully linked mobile cards", () => {
  for (const label of ["Titel", "Kategorie", "Status", "Autor", "Veröffentlichungsdatum", "Übersicht"]) assert.ok(overview.includes(label));
  assert.match(overview, /hidden overflow-hidden xl:block/);
  assert.match(overview, /xl:hidden/);
  assert.match(card, /AdminListMobileCard/);
  assert.doesNotMatch(card, /DeleteNewsButton|button/);
});

test("empty state and create page use shared module primitives", () => {
  assert.match(empty, /AdminModuleEmptyState/);
  assert.match(newPage, /AdminDetailLayout/);
  assert.match(newPage, /AdminDetailHeader/);
});

test("edit page provides detail sections and danger action only at the bottom", () => {
  for (const marker of ["AdminDetailLayout", "AdminDetailHeader", "NewsDetailSummary", "AdminDangerZone", "DeleteNewsButton"]) assert.ok(editPage.includes(marker));
  const header = editPage.slice(editPage.indexOf("header={<AdminDetailHeader"), editPage.indexOf("dangerZone="));
  assert.doesNotMatch(header, /DeleteNewsButton|löschen/);
  assert.match(editor, /id="news-editor-form"/);
});

test("upload publish and document handlers remain wired to the existing editor", () => {
  for (const marker of ["uploadNewsMediaAction", "uploadNewsDocumentMediaAction", "handleDocumentSelect", "handleDocumentDelete", "NewsSettingsTab"]) assert.ok(editor.includes(marker));
});
