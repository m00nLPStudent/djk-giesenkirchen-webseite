import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const actions = read("../../../app/admin/department/board/actions.js");
const editPage = read("../../../app/admin/department/board/edit/[id]/page.js");

test("all board mutations require dedicated board permissions before scope and persistence", () => {
  for (const permission of ["board.create", "board.edit", "board.delete"]) assert.match(actions, new RegExp(permission.replace(".", "\\.")));
  assert.doesNotMatch(actions, /requiredPermission:[^\n]*settings\.view/);
  assert.match(actions, /saveBoardMemberWithScopeAction[\s\S]*requiredPermission: boardMemberId \? "board\.edit" : "board\.create"[\s\S]*loadServerPersonScopeContext[\s\S]*canEditBoardMemberOnServer[\s\S]*saveBoardMember/);
  assert.match(actions, /resolveBoardOrganizationTarget[\s\S]*createSupabaseAdminClient\(\)[\s\S]*saveBoardMember/);
  assert.match(actions, /authorizeBoardMedia[\s\S]*requiredPermission: boardMemberId \? "board\.edit" : "board\.create"[\s\S]*loadServerPersonScopeContext[\s\S]*canEditBoardMemberOnServer/);
});

test("picker, upload and media removal share the hardened mutation authorization", () => {
  assert.match(actions, /loadBoardMediaPickerAction[\s\S]*authorizeBoardMedia\(boardMemberId\)/);
  assert.match(actions, /uploadBoardMediaAction[\s\S]*authorizeBoardMedia\(boardMemberId\)/);
  assert.match(actions, /saveBoardMemberWithScopeAction[\s\S]*synchronizeMediaAssignment\("board_member"/);
});

test("read-only board detail and mutation controls use board permissions", () => {
  assert.match(editPage, /requiredPermission: "board\.view"/);
  assert.match(editPage, /Can permission="board\.delete"/);
});

test("delete remains edit-and-scope protected before the admin client", () => {
  assert.match(actions, /removeBoardMemberWithScopeAction[\s\S]*requiredPermission: "board\.delete"[\s\S]*loadServerPersonScopeContext[\s\S]*canDeleteBoardMemberOnServer[\s\S]*createSupabaseAdminClient/);
  assert.doesNotMatch(actions, /remove_entity|\.rpc\(/);
});

test("media visibility and central assignment behavior remain unchanged", () => {
  assert.match(actions, /canManageMedia[\s\S]*\["public", "admin"\][\s\S]*\["public"\]/);
  assert.doesNotMatch(actions, /"restricted"/);
  assert.match(actions, /visibility: "public", purpose: "board"/);
  assert.match(actions, /synchronizeMediaAssignment\("board_member"/);
});
