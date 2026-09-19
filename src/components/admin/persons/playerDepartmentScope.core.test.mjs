import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  isPlayerDepartmentManagerScope,
  resolvePlayerDepartmentScopeDecision,
} from "./playerDepartmentScope.core.mjs";

const tableTennisId = "department-table-tennis";
const footballId = "department-football";
const teams = new Map([
  ["tt-team", { id: "tt-team", department_id: tableTennisId }],
  ["football-team", { id: "football-team", department_id: footballId }],
]);
const globalScope = { isGlobal: true, roleKeys: ["superadmin"], roleScopeTypes: ["global"] };
const tableTennisManager = {
  roleKeys: ["tischtennis-vorstand"],
  roleScopeTypes: ["department_manager"],
  managedDepartmentId: tableTennisId,
};
const footballManager = {
  roleKeys: ["fussball-vorstand"],
  roleScopeTypes: ["department_manager"],
  managedDepartmentId: footballId,
};

for (const operation of ["READ", "CREATE", "UPDATE", "DELETE", "ASSIGN"]) {
  test(`superadmin has global table-tennis player ${operation} scope`, () => {
    assert.equal(resolvePlayerDepartmentScopeDecision(globalScope, {
      departmentId: tableTennisId,
      teamIds: operation === "ASSIGN" ? ["tt-team"] : [],
      teamById: teams,
    }), true);
  });
}

test("table-tennis department manager can manage only table-tennis players", () => {
  assert.equal(isPlayerDepartmentManagerScope(tableTennisManager), true);
  assert.equal(resolvePlayerDepartmentScopeDecision(tableTennisManager, { departmentId: tableTennisId }), true);
  assert.equal(resolvePlayerDepartmentScopeDecision(tableTennisManager, { departmentId: tableTennisId, teamIds: ["tt-team"], teamById: teams }), true);
  assert.equal(resolvePlayerDepartmentScopeDecision(tableTennisManager, { departmentId: footballId }), false);
  assert.equal(resolvePlayerDepartmentScopeDecision(tableTennisManager, { departmentId: tableTennisId, teamIds: ["football-team"], teamById: teams }), false);
});

test("football department manager can manage only football players", () => {
  assert.equal(resolvePlayerDepartmentScopeDecision(footballManager, { departmentId: footballId, teamIds: ["football-team"], teamById: teams }), true);
  assert.equal(resolvePlayerDepartmentScopeDecision(footballManager, { departmentId: tableTennisId, teamIds: ["tt-team"], teamById: teams }), false);
});

test("missing team metadata fails closed for department managers", () => {
  assert.equal(resolvePlayerDepartmentScopeDecision(tableTennisManager, { departmentId: tableTennisId, teamIds: ["unknown-team"], teamById: teams }), false);
});

test("unscoped, inactive and unauthenticated access remain outside the player scope grant", async () => {
  assert.equal(resolvePlayerDepartmentScopeDecision({}, { departmentId: tableTennisId }), null);
  assert.equal(resolvePlayerDepartmentScopeDecision(null, { departmentId: tableTennisId }), null);
  const permissionSource = await readFile(new URL("../../../lib/admin-auth/adminActionPermissions.js", import.meta.url), "utf8");
  assert.match(permissionSource, /if \(userError \|\| !user\?\.id\)[\s\S]*reason: "no-session"/);
  assert.match(permissionSource, /if \(profile\.is_active === false\)[\s\S]*reason: "inactive-user"/);
});

test("route and mutations consume the same server-side department decision", async () => {
  const [scopeSource, newPage, detailPage, actions] = await Promise.all([
    readFile(new URL("./serverPersonScope.js", import.meta.url), "utf8"),
    readFile(new URL("../../../app/admin/players/new/page.js", import.meta.url), "utf8"),
    readFile(new URL("../../../app/admin/players/[id]/page.js", import.meta.url), "utf8"),
    readFile(new URL("../../../app/admin/players/actions.js", import.meta.url), "utf8"),
  ]);
  assert.match(scopeSource, /resolvePlayerDepartmentScopeDecision/);
  assert.match(newPage, /canCreatePlayerOnServer\([\s\S]*department_id: requiredDepartment\?\.id/);
  assert.match(detailPage, /canDeletePlayerOnServer\(scopeContext, playerTeamIds, teamById, player\)/);
  assert.match(actions, /canCreatePlayerOnServer\(scopeContext, targetTeamIds, targetTeamMap, safePlayerPayload\)/);
});
