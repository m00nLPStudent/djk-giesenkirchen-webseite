import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("global inventories stay neutral while football and table-tennis wrappers remain explicit", async () => {
  const [players, playerDetail, coaches, teams, teamDetail, ttPlayers, ttCoaches, ttTeams, footballPlayers, footballCoaches, footballTeams] = await Promise.all([
    read("../../../app/admin/players/page.js"),
    read("../../../app/admin/players/[id]/page.js"),
    read("../../../app/admin/coaches/page.js"),
    read("../../../app/admin/teams/page.js"),
    read("../../../app/admin/teams/[id]/page.js"),
    read("../../../app/admin/table-tennis/players/page.js"),
    read("../../../app/admin/table-tennis/coaches/page.js"),
    read("../../../app/admin/table-tennis/teams/page.js"),
    read("../../../app/admin/football/players/page.js"),
    read("../../../app/admin/football/coaches/page.js"),
    read("../../../app/admin/football/teams/page.js"),
  ]);

  for (const source of [players, playerDetail, coaches, teams, teamDetail]) {
    assert.match(source, /requiredDepartmentSlug = null/);
  }
  for (const source of [ttPlayers, ttCoaches, ttTeams]) {
    assert.match(source, /requiredDepartmentSlug="tischtennis"/);
  }
  for (const source of [footballPlayers, footballCoaches, footballTeams]) {
    assert.match(source, /requiredDepartmentSlug="fussball"/);
  }
  assert.match(players, /playersQuery = playersQuery\.eq\("department_id", requiredDepartment\.id\)/);
  assert.match(coaches, /coachesQuery = coachesQuery\.eq\("department_id", requiredDepartment\.id\)/);
  assert.match(teams, /teamsQuery = teamsQuery\.eq\("department_id", requiredDepartment\.id\)/);
});

test("player and coach inventory separate department from missing team membership", async () => {
  const [players, coaches, coachCard, teams] = await Promise.all([
    read("../players/AdminPlayersList.js"),
    read("../coaches/AdminCoachesList.js"),
    read("../coaches/components/CoachCard.js"),
    read("../teams/AdminTeamsList.js"),
  ]);
  assert.match(players, /Keine Mannschaft/);
  assert.match(coaches, /Keine Mannschaft/);
  assert.match(coachCard, /Keine Mannschaft/);
  assert.match(teams, /Nicht zugeordnet/);
  assert.match(players, /department_name_de/);
  assert.match(coaches, /departmentName/);
  assert.match(teams, /department_name_de/);
});

test("seasonal player scope map carries the real department into detail authorization", async () => {
  const [repository, core, personRepository, detail] = await Promise.all([
    read("../persons/playerSeasonalReadModelRepository.js"),
    read("../persons/seasonalReadModelCore.mjs"),
    read("../persons/personTeamRepository.js"),
    read("../../../app/admin/players/[id]/page.js"),
  ]);
  assert.match(repository, /department_id, departments\(slug, name_de\)/);
  assert.match(core, /departmentId: team\.department_id \|\| null/);
  assert.match(personRepository, /department_id: assignment\.departmentId \|\| null/);
  assert.match(detail, /player\.department_id !== requiredDepartment\?\.id/);
});

test("global person edits allow valid department targets while explicit department routes stay fail closed", async () => {
  const [playerForm, playerAction, playerEdit, coachForm, coachAction, coachEdit] = await Promise.all([
    read("../players/forms/AdminPlayersForm.js"),
    read("../../../app/admin/players/actions.js"),
    read("../../../app/admin/players/edit/[id]/page.js"),
    read("../coaches/forms/AdminCoachesForm.js"),
    read("../../../app/admin/coaches/actions.js"),
    read("../../../app/admin/coaches/edit/[id]/page.js"),
  ]);
  assert.match(playerEdit, /: "global"/);
  assert.match(coachEdit, /: "global"/);
  assert.match(playerForm, /sportContext === "global" \? null/);
  assert.match(coachForm, /sportContext === "global" \? null/);
  assert.match(playerAction, /expectedDepartmentSlug && targetResolution\.teamSeasonOption && targetDepartmentSlug !== expectedDepartmentSlug/);
  assert.match(coachAction, /expectedDepartmentSlug && targetDepartmentSlugs\.some/);
});

test("football department managers never inherit global person or team inventory", async () => {
  const [personScope, serverTeamScope, clientTeamScope] = await Promise.all([
    read("../persons/serverPersonScope.js"),
    read("../teams/serverTeamScope.js"),
    read("../teams/teamScope.js"),
  ]);
  for (const source of [personScope, serverTeamScope, clientTeamScope]) {
    assert.doesNotMatch(source, /GLOBAL_[A-Z_]+ = \[[^\]]*"fussball-vorstand"/);
  }
  assert.match(personScope, /isDepartmentManagerScope\(scopeContext\)/);
  assert.match(serverTeamScope, /resolveRoleScope\(scopeContext, "teams"\)/);
  assert.match(clientTeamScope, /team\.department_id === scopeContext\.managedDepartmentId/);
});

test("removing a roster member replaces only team-season assignments, never player master data", async () => {
  const service = await read("../teams/services/teams.service.js");
  assert.match(service, /\.from\("player_team_seasons"\)[\s\S]*?\.delete\(\)[\s\S]*?\.eq\("team_season_id", teamSeasonId\)/);
  assert.doesNotMatch(service, /\.from\("players"\)[\s\S]{0,120}\.delete\(\)/);
});

test("board detail resolves the explicit organization scope instead of inferring it from NULL", async () => {
  const [page, detail, form, organizationScope] = await Promise.all([
    read("../../../app/admin/department/board/edit/[id]/page.js"),
    read("../board/components/BoardMemberDetailOverview.js"),
    read("../board/forms/AdminBoardMemberForm.js"),
    read("../board/boardOrganizationScope.core.mjs"),
  ]);
  assert.match(page, /member\.department_id[\s\S]*from\("departments"\)/);
  assert.match(page, /getBoardOrganizationLabel\(/);
  assert.match(organizationScope, /organization_scope === BOARD_ORGANIZATION_SCOPES\.CLUB[\s\S]*"Gesamtverein"[\s\S]*organization_scope === BOARD_ORGANIZATION_SCOPES\.UNASSIGNED[\s\S]*"Nicht zugeordnet"/);
  assert.doesNotMatch(detail, /label="Abteilung">Fußballabteilung/);
  assert.match(detail, /label="Organisationsbereich"/);
  assert.match(detail, /sm:!grid-cols-1 sm:!gap-1 md:!grid-cols-\[12rem_minmax\(0,1fr\)\] md:!gap-5/);
  for (const label of ["Organisationsbereich", "Funktion", "Status", "Reihenfolge"]) {
    assert.match(detail, new RegExp(`label="${label}" className=\\{FUNCTION_ROW_LAYOUT\\}`));
  }
  assert.match(form, /Bereich:[\s\S]*departmentLabel/);
});

test("club, football and table-tennis board routes are explicit and server-fixed", async () => {
  const [clubList, clubNew, clubEdit, departmentPage, newPage, editPage, action, structureRepository, navigation, permissions] = await Promise.all([
    read("../../../app/admin/club/board/page.js"),
    read("../../../app/admin/club/board/new/page.js"),
    read("../../../app/admin/club/board/edit/[id]/page.js"),
    read("../../../app/admin/department/page.js"),
    read("../../../app/admin/department/board/new/page.js"),
    read("../../../app/admin/department/board/edit/[id]/page.js"),
    read("../../../app/admin/department/board/actions.js"),
    read("../structure/structureAssignment.repository.js"),
    read("../navigation/adminNavigation.config.js"),
    read("../../../lib/admin-auth/adminPermissionConfig.js"),
  ]);

  assert.match(clubList, /requiredOrganizationScope="club"/);
  assert.match(clubNew, /requiredOrganizationScope="club"/);
  assert.match(clubEdit, /requiredOrganizationScope="club"/);
  assert.match(departmentPage, /requiredOrganizationScope === "club"[\s\S]*\.eq\("organization_scope", "club"\)[\s\S]*\.is\("department_id", null\)/);
  assert.match(newPage, /organizationScope=\{isClub \? "club" : null\}/);
  assert.match(editPage, /member\.organization_scope !== "club" \|\| member\.department_id/);
  assert.match(action, /resolveBoardOrganizationTarget\([\s\S]*routeOrganizationScope/);
  assert.match(action, /departmentResult\.data\?\.slug === "tischtennis"[\s\S]*roleResult\.data\.department_id[\s\S]*TABLE_TENNIS_SHARED_ROLE_SLUGS/);
  assert.match(structureRepository, /\.eq\("organization_scope", "unassigned"\)\.is\("department_id", null\)/);
  assert.match(navigation, /"Vorstand Gesamtverein", "\/admin\/club\/board"/);
  assert.match(navigation, /"Vorstand Fußball", "\/admin\/football\/board"/);
  assert.match(navigation, /"Vorstand Tischtennis", "\/admin\/table-tennis\/board"/);
  assert.match(permissions, /buildRule\("\/admin\/club\/board", "board\.view"/);
});
