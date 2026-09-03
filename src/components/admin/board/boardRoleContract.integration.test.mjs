import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("board pages and actions enforce row-specific role contract", () => {
  const scope = read("../persons/serverPersonScope.js");
  const actions = read("../../../app/admin/department/board/actions.js");
  const list = read("../../../app/admin/department/page.js");
  assert.match(scope, /canAccessBoardMember\(scopeContext, boardMember\)/);
  assert.match(scope, /isBoardGlobalBusinessManager\(scopeContext\)/);
  assert.doesNotMatch(scope, /isDepartmentManagerScope\(scopeContext\)\) return canAccessBoardDepartmentOnServer/);
  assert.match(actions, /buildOwnBoardCardPayload\(memberPayload, existingMember\)/);
  assert.match(actions, /organization_scope === "unassigned"/);
  assert.match(list, /filter\(\(member\) => canViewBoardMemberOnServer\(scopeContext, member\)\)/);
});

test("system pages, actions and browser loaders all have a superadmin boundary", () => {
  const paths = [
    "../../../app/admin/users/page.js",
    "../../../app/admin/roles/page.js",
    "../../../app/admin/permissions/page.js",
    "../../../app/admin/permissions/matrix/page.js",
    "../../../app/admin/users/actions.js",
    "../../../app/admin/roles/actions.js",
    "../../../app/admin/permissions/actions.js",
    "../users/services/users.service.js",
    "../roles/services/roles.service.js",
    "../permissions/services/permissions.service.js",
  ];
  for (const path of paths) assert.match(read(path), /superadmin|Superadmin/, path);
});

test("cashier no longer receives an implicit own-board scope", () => {
  const repository = read("../../../lib/admin-auth/scopes/scopeRepository.js");
  assert.match(repository, /kassierer: \["own_profile", "read_only"\]/);
});
