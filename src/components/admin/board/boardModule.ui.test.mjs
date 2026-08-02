import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const list = read("./AdminBoardList.js");
const page = read("../../../app/admin/department/page.js");
const detail = read("../../../app/admin/department/board/edit/[id]/page.js");
const create = read("../../../app/admin/department/board/new/page.js");
const avatar = read("./components/BoardMemberAvatar.js");
const form = read("./forms/AdminBoardMemberForm.js");
const actions = read("../../../app/admin/department/board/actions.js");

test("overview uses shared header, integrated search, primary action, summary and collapsed filter", () => {
  for (const value of ["AdminModulePage", "AdminModuleHeader", "AdminModuleSearch", "AdminModulePrimaryAction", "AdminModuleSummary", "AdminModuleFilters"]) assert.ok(list.includes(value));
  assert.match(list, /Vorstand & Abteilungen/);
  assert.match(list, /Vorstandsmitglieder, Ansprechpartner und Abteilungen verwalten/);
  assert.doesNotMatch(list, /defaultExpanded/);
});

test("desktop table and mobile cards show the existing person fields", () => {
  for (const value of ["AdminModuleList", "AdminListHeader", "AdminListRow", "AdminModuleCards", "AdminListMobileCard", "AdminListChevron", "BoardMemberAvatar", "BoardMemberStatus"]) assert.ok(list.includes(value));
  for (const label of ["Profilbild", "Name", "Funktion", "Abteilung", "Status", "Übersicht"]) assert.ok(list.includes(label));
  assert.match(list, /hidden overflow-hidden xl:block/);
  assert.match(list, /className="xl:hidden"/);
  assert.doesNotMatch(list, /overflow-x-auto/);
});

test("edit links preserve permission and per-person scope visibility", () => {
  assert.match(list, /settings\.view/);
  assert.match(list, /_canEditInScope === false/);
  assert.match(page, /canEditBoardMemberOnServer/);
  assert.match(page, /canDeleteBoardMemberOnServer/);
});

test("avatar reuses the established person image and initials fallback", () => {
  assert.match(avatar, /CoachAvatar/);
  assert.match(avatar, /displayName: getBoardMemberName/);
});

test("detail has shared header, information, edit action and lower danger zone", () => {
  for (const value of ["AdminDetailLayout", "AdminDetailHeader", "BoardMemberAvatar", "BoardMemberStatus", "BoardMemberDetailOverview", "AdminDangerZone", "BoardMemberDeleteButton"]) assert.ok(detail.includes(value));
  assert.match(detail, />Bearbeiten</);
  assert.doesNotMatch(list, /AdminRemoveButton|removeBoardMemberRecord|löschen/i);
});

test("create and edit forms keep every existing field and write path", () => {
  for (const value of ["first_name", "last_name", "role_id", "role_de", "role_en", "email", "phone", "image_url", "is_active", "sort_order"]) assert.ok(form.includes(value));
  assert.match(form, /saveBoardMemberWithScopeAction/);
  assert.match(create, /canCreateBoardMemberOnServer/);
  assert.match(actions, /removeBoardMemberWithScopeAction/);
});

test("existing queries and routes remain anchored", () => {
  assert.match(page, /\.from\("board_members"\)[\s\S]*\.order\("sort_order"/);
  assert.match(detail, /\.from\("board_members"\)\.select\("\*"\)\.eq\("id", id\)\.maybeSingle\(\)/);
  assert.match(create, /\.from\("board_roles"\)\.select\("\*"\)/);
  assert.match(list, /admin\/department\/board\/edit/);
  assert.match(list, /admin\/department\/board\/new/);
});
