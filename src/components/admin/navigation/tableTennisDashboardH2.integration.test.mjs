import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ADMIN_NAVIGATION_SECTIONS } from "./adminNavigation.config.js";
import { resolveAdminNavigation } from "./adminNavigation.resolver.js";
import { createEmptyScopeContext } from "../../../lib/admin-auth/scopes/scopeContext.js";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const permissions = [
  "dashboard.view",
  "teams.view", "teams.create", "teams.edit", "teams.delete",
  "players.view", "players.create", "players.edit", "players.delete",
  "coaches.view", "coaches.create", "coaches.edit", "coaches.delete",
  "board.view", "board.create", "board.edit", "board.delete",
];

test("tischtennis-vorstand sees only the active table-tennis administration group", () => {
  const result = resolveAdminNavigation({
    sections: ADMIN_NAVIGATION_SECTIONS,
    permissionKeys: permissions,
    roleKeys: ["tischtennis-vorstand"],
    scopeContext: { roleScopeTypes: ["department_manager", "own_board_card"], managedDepartmentId: "tt" },
    currentPath: "/admin/table-tennis/teams",
  });
  const tableTennis = result.sections.find((section) => section.key === "table_tennis");
  assert.deepEqual(tableTennis.items.map((item) => item.key), [
    "table-tennis-teams", "table-tennis-players", "table-tennis-coaches", "table-tennis-board",
  ]);
  assert.equal(result.sections.some((section) => section.key === "football"), false);
});

test("global and unscoped contexts keep the optional managed department nullable", async () => {
  const repository = await read("../../../lib/admin-auth/scopes/scopeRepository.js");
  assert.match(repository, /export function buildScopeContext\(\{[\s\S]*managedDepartmentId = null,[\s\S]*managedDepartmentSlug = null,/);

  const superadmin = createEmptyScopeContext({ roleKeys: ["superadmin"], roleScopeTypes: ["global"], isGlobal: true });
  assert.equal(superadmin.isGlobal, true);
  assert.equal(superadmin.managedDepartmentId, null);

  const ordinary = createEmptyScopeContext({ roleKeys: ["trainer"] });
  assert.equal(ordinary.managedDepartmentId, null);
});

test("department-manager resolution is shared, explicit and server-side", async () => {
  const repository = await read("../../../lib/admin-auth/scopes/scopeRepository.js");
  assert.match(repository, /resolveManagedDepartmentRole\(roleKeys\)/);
  assert.match(repository, /eq\("slug", managedDepartmentRole\.departmentSlug\)\.eq\("is_active", true\)/);
  assert.match(repository, /managedDepartmentId: departmentResult\.data\?\.id \|\| null/);
});

test("table-tennis pages bind every shared loader to the fixed department", async () => {
  const wrappers = await Promise.all([
    read("../../../app/admin/table-tennis/teams/page.js"),
    read("../../../app/admin/table-tennis/players/page.js"),
    read("../../../app/admin/table-tennis/coaches/page.js"),
    read("../../../app/admin/table-tennis/board/page.js"),
  ]);
  for (const wrapper of wrappers) assert.match(wrapper, /requiredDepartmentSlug="tischtennis"/);
});

test("department-specific loaders constrain queries before counts and filters", async () => {
  const [teams, players, coaches, board] = await Promise.all([
    read("../../../app/admin/teams/page.js"),
    read("../../../app/admin/players/page.js"),
    read("../../../app/admin/coaches/page.js"),
    read("../../../app/admin/department/page.js"),
  ]);
  assert.match(teams, /teamsQuery = teamsQuery\.eq\("department_id", requiredDepartment\.id\)/);
  assert.match(players, /playersQuery = playersQuery\.eq\("department_id", requiredDepartment\.id\)/);
  assert.match(coaches, /coachesQuery = coachesQuery\.eq\("department_id", requiredDepartment\.id\)/);
  assert.match(board, /membersQuery = membersQuery\.eq\("organization_scope", "department"\)\.eq\("department_id", boardDepartmentId\)/);
  for (const source of [teams, players, coaches, board]) {
    assert.match(source, /missing-department-scope/);
  }
});

test("H2 mutations bind department scope before privileged person writes", async () => {
  const [scope, teams, players, coaches, board] = await Promise.all([
    read("../../../lib/admin-auth/scopes/scopeRepository.js"),
    read("../../../app/admin/teams/actions.js"),
    read("../../../app/admin/players/actions.js"),
    read("../../../app/admin/coaches/actions.js"),
    read("../../../app/admin/department/board/actions.js"),
  ]);
  assert.match(scope, /eq\("slug", managedDepartmentRole\.departmentSlug\)/);
  assert.match(teams, /teamPayload = \{ \.\.\.teamPayload, department_id: scopeContext\.managedDepartmentId \}/);
  assert.match(players, /const writeClient = createSupabaseAdminClient\(\)/);
  assert.match(players, /getPlayerTeamIdsMap\(\s*writeClient/);
  assert.match(coaches, /getCoachTeamIdsMap\(writeClient/);
  assert.match(board, /requiredPermission: boardMemberId \? "board\.edit" : "board\.create"/);
  assert.match(board, /resolveBoardOrganizationTarget\([\s\S]*managedDepartmentId: scopeContext\.managedDepartmentId/);
});

test("H2 creates no authentication accounts for player or coach records", async () => {
  const sources = await Promise.all([
    read("../../../app/admin/players/actions.js"),
    read("../../../app/admin/coaches/actions.js"),
  ]);
  for (const source of sources) {
    assert.doesNotMatch(source, /auth\.admin\.createUser|inviteUserByEmail|signUp\(/);
  }
});
