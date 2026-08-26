import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const actions = read("../../../app/admin/department/board/actions.js");
const editPage = read("../../../app/admin/department/board/edit/[id]/page.js");

test("all board mutations require settings.edit before scope and persistence", () => {
  assert.equal(actions.match(/requiredPermission: "settings\.edit"/g)?.length, 3);
  assert.doesNotMatch(actions, /requiredPermission:[^\n]*settings\.view/);
  assert.match(actions, /saveBoardMemberWithScopeAction[\s\S]*requiredPermission: "settings\.edit"[\s\S]*loadServerPersonScopeContext[\s\S]*canEditBoardMemberOnServer[\s\S]*saveBoardMember/);
  assert.match(actions, /authorizeBoardMedia[\s\S]*requiredPermission: "settings\.edit"[\s\S]*loadServerPersonScopeContext[\s\S]*canEditBoardMemberOnServer/);
});

test("picker, upload and media removal share the hardened mutation authorization", () => {
  assert.match(actions, /loadBoardMediaPickerAction[\s\S]*authorizeBoardMedia\(boardMemberId\)/);
  assert.match(actions, /uploadBoardMediaAction[\s\S]*authorizeBoardMedia\(boardMemberId\)/);
  assert.match(actions, /saveBoardMemberWithScopeAction[\s\S]*synchronizeMediaAssignment\("board_member"/);
});

test("read-only board detail retains settings.view while mutation controls retain edit", () => {
  assert.match(editPage, /requiredPermission: "settings\.view"/);
  assert.match(editPage, /Can permission="settings\.edit"/);
});

test("delete remains edit-and-scope protected before the admin client", () => {
  assert.match(actions, /removeBoardMemberWithScopeAction[\s\S]*requiredPermission: "settings\.edit"[\s\S]*loadServerPersonScopeContext[\s\S]*canDeleteBoardMemberOnServer[\s\S]*createSupabaseAdminClient/);
  assert.doesNotMatch(actions, /remove_entity|\.rpc\(/);
});

test("media visibility and central assignment behavior remain unchanged", () => {
  assert.match(actions, /canManageMedia[\s\S]*\["public", "admin"\][\s\S]*\["public"\]/);
  assert.doesNotMatch(actions, /"restricted"/);
  assert.match(actions, /visibility: "public", purpose: "board"/);
  assert.match(actions, /synchronizeMediaAssignment\("board_member"/);
});
