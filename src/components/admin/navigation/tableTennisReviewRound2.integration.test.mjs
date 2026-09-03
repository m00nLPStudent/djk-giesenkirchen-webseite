import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("shared team forms hide legacy English inputs and omit them from writes", async () => {
  const [description, training, payload, service] = await Promise.all([
    read("../teams/forms/tabs/TeamDescriptionTab.js"),
    read("../teams/forms/tabs/TeamTrainingTab.js"),
    read("../teams/forms/helpers/teamFormPayload.js"),
    read("../teams/services/teams.service.js"),
  ]);
  assert.doesNotMatch(description, /Beschreibung Englisch|description_en/);
  assert.doesNotMatch(training, /Trainingszeiten Englisch|training_times_en/);
  assert.match(payload, /delete payload\.description_en/);
  assert.match(payload, /delete payload\.training_times_en/);
  assert.match(service, /Object\.hasOwn\(team, "description_en"\)/);
  assert.match(service, /Object\.hasOwn\(team, "training_times_en"\)/);
});

test("table-tennis player UI shows its required fields without football-only inputs", async () => {
  const [form, basic, profile, description] = await Promise.all([
    read("../players/forms/AdminPlayersForm.js"),
    read("../players/forms/fields/PlayerBasicFields.js"),
    read("../players/forms/fields/PlayerProfileFields.js"),
    read("../players/forms/fields/PlayerDescriptionFields.js"),
  ]);
  assert.match(basic, /label="Vorname"[\s\S]*required/);
  assert.match(basic, /label="Nachname"[\s\S]*required/);
  assert.match(basic, /label="Mannschaft \(optional\)"/);
  assert.match(basic, /sportContext !== "table_tennis"[\s\S]*label="Rückennummer"/);
  assert.match(profile, /label=\{sportContext === "table_tennis" \? "Starke Hand"/);
  assert.match(profile, /required=\{sportContext === "table_tennis"\}/);
  assert.match(form, /effectiveSportContext === "table_tennis" \? PLAYER_FORM_TABS\.filter/);
  assert.doesNotMatch(description, /description_en|Beschreibung Englisch/);
});

test("table-tennis player writes reject cross-department and football-specific values", async () => {
  const actions = await read("../../../app/admin/players/actions.js");
  assert.match(actions, /expectedDepartmentSlug && targetResolution\.teamSeasonOption && targetDepartmentSlug !== expectedDepartmentSlug/);
  assert.match(actions, /\["Rechts", "Links"\]\.includes\(safePlayerPayload\.strong_hand\)/);
  assert.match(actions, /\["shirt_number", "position_de", "position_en", "strong_foot"\]/);
  assert.match(actions, /hasValue\(field\) && !unchanged\(field\)/);
  assert.match(actions, /resolvePlayerTeamSeasonTarget/);
});

test("board routes enforce their department and public football never falls back", async () => {
  const [actions, form, adminPage, publicPage, ttWrapper, createPage, editPage] = await Promise.all([
    read("../../../app/admin/department/board/actions.js"),
    read("../board/forms/AdminBoardMemberForm.js"),
    read("../../../app/admin/department/page.js"),
    read("../../../app/(website)/fussball/abteilung/vorstand/page.js"),
    read("../../../app/admin/table-tennis/board/page.js"),
    read("../../../app/admin/department/board/new/page.js"),
    read("../../../app/admin/department/board/edit/[id]/page.js"),
  ]);
  assert.doesNotMatch(form, /label="Funktion Englisch"/);
  assert.match(actions, /resolveBoardOrganizationTarget\([\s\S]*routeDepartmentId: routeDepartment\?\.id/);
  assert.match(actions, /existingMember\.department_id !== expectedDepartment\.id/);
  assert.match(adminPage, /requiredDepartmentSlug = null/);
  assert.match(adminPage, /canViewBoardMemberOnServer\(scopeContext, member\)/);
  assert.match(adminPage, /membersQuery = membersQuery\.eq\("organization_scope", "department"\)\.eq\("department_id", boardDepartmentId\)/);
  assert.match(publicPage, /eq\("slug", "fussball"\)/);
  assert.match(publicPage, /eq\("organization_scope", "department"\)[\s\S]*eq\("department_id", footballDepartment\.id\)/);
  assert.match(ttWrapper, /requiredDepartmentSlug="tischtennis"/);
  assert.match(createPage, /\["fussball", "tischtennis"\]\.includes\(params\?\.department\)/);
  assert.match(createPage, /departmentSlug=\{requestedSlug\}/);
  assert.match(editPage, /member\.department_id !== requestedDepartment\?\.id/);
  assert.match(editPage, /departmentSlug=\{requestedSlug\}/);
});

test("global player edit remains neutral while table-tennis edit stays explicit", async () => {
  const [globalEdit, ttEdit, scope] = await Promise.all([
    read("../../../app/admin/players/edit/[id]/page.js"),
    read("../../../app/admin/table-tennis/players/edit/[id]/page.js"),
    read("../persons/serverPersonScope.js"),
  ]);
  assert.match(globalEdit, /requiredDepartmentSlug = null/);
  assert.match(ttEdit, /requiredDepartmentSlug="tischtennis"/);
  assert.match(scope, /if \(canAccessAllPersonModules\(scopeContext\)\) return true/);
  assert.match(scope, /isDepartmentManagerScope\(scopeContext\)/);
});
