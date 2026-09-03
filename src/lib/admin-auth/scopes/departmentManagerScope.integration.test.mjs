import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { resolveBoardOrganizationTarget } from "../../../components/admin/board/boardOrganizationScope.core.mjs";
import { canAccessAssignedTeam } from "./scopeEngine.js";
import { resolveManagedDepartmentRole } from "./departmentManagerScope.core.mjs";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

function departmentContext(roleKey, departmentId, ownTeamId) {
  const role = resolveManagedDepartmentRole([roleKey]);
  return {
    roleKeys: [roleKey],
    roleScopeTypes: ["department_manager"],
    managedDepartmentId: departmentId,
    managedDepartmentSlug: role.departmentSlug,
    assignedTeamIds: [ownTeamId],
    isGlobal: false,
  };
}

for (const contract of [
  { roleKey: "fussball-vorstand", slug: "fussball", departmentId: "football-id", ownTeamId: "football-team", foreignDepartmentId: "table-tennis-id", foreignTeamId: "table-tennis-team" },
  { roleKey: "tischtennis-vorstand", slug: "tischtennis", departmentId: "table-tennis-id", ownTeamId: "table-tennis-team", foreignDepartmentId: "football-id", foreignTeamId: "football-team" },
]) {
  test(`${contract.roleKey} receives the shared department-only team and person assignment scope`, () => {
    const context = departmentContext(contract.roleKey, contract.departmentId, contract.ownTeamId);
    assert.equal(context.managedDepartmentSlug, contract.slug);
    assert.equal(canAccessAssignedTeam(context, contract.ownTeamId), true);
    assert.equal(canAccessAssignedTeam(context, contract.foreignTeamId), false);
  });

  test(`${contract.roleKey} can use only its own board department`, () => {
    const own = resolveBoardOrganizationTarget({
      requestedScope: "department",
      requestedDepartmentId: contract.departmentId,
      managedDepartmentId: contract.departmentId,
    });
    assert.equal(own.ok, true);
    assert.equal(resolveBoardOrganizationTarget({ requestedScope: "department", requestedDepartmentId: contract.foreignDepartmentId, managedDepartmentId: contract.departmentId }).ok, false);
    assert.equal(resolveBoardOrganizationTarget({ requestedScope: "club", managedDepartmentId: contract.departmentId }).ok, false);
    assert.equal(resolveBoardOrganizationTarget({ requestedScope: "unassigned", managedDepartmentId: contract.departmentId }).ok, false);
  });
}

test("player, coach, team and board actions retain server-side target checks", async () => {
  const [players, coaches, teams, teamScope, board] = await Promise.all([
    read("../../../app/admin/players/actions.js"),
    read("../../../app/admin/coaches/actions.js"),
    read("../../../app/admin/teams/actions.js"),
    read("../../../components/admin/teams/teamScope.js"),
    read("../../../app/admin/department/board/actions.js"),
  ]);
  assert.match(players, /canCreatePlayerOnServer\(scopeContext, targetTeamIds, targetTeamMap\)/);
  assert.match(players, /canEditPlayerOnServer\(scopeContext, existingTeamIds, teamById, existingPlayer\)/);
  assert.match(coaches, /canEditCoachOnServer\([\s\S]*scopeContext,[\s\S]*existingTeamIds,[\s\S]*teamById/);
  assert.match(coaches, /canCreateCoachOnServer\(scopeContext\)/);
  assert.match(teams, /teamPayload\?\.department_id[\s\S]{0,80}!== scopeContext\.managedDepartmentId/);
  assert.match(teams, /canAccessTeamOnServer\(scopeContext, existingTeam\)/);
  assert.match(teamScope, /team\.department_id === scopeContext\.managedDepartmentId/);
  assert.match(board, /resolveBoardOrganizationTarget\([\s\S]*managedDepartmentId: scopeContext\.managedDepartmentId/);
  assert.match(board, /canEditBoardMemberOnServer\(scopeContext, existingMember\)/);
});

test("superadmin stays global and the board contract still accepts all three valid targets", () => {
  assert.deepEqual(resolveManagedDepartmentRole(["superadmin", "tischtennis-vorstand"]), {
    departmentSlug: null,
    conflict: false,
  });
  for (const target of [
    { requestedScope: "club", requestedDepartmentId: null },
    { requestedScope: "department", requestedDepartmentId: "department-id" },
    { requestedScope: "unassigned", requestedDepartmentId: null },
  ]) {
    assert.equal(resolveBoardOrganizationTarget({ ...target, isGlobal: true }).ok, true);
  }
});
