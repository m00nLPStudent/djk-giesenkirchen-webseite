import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");

test("team templates carry and validate a department server-side", () => {
  const core = read("../settings/team-types/teamTypes.core.js");
  const actions = read("../../../app/admin/settings/team-types/actions.js");
  const repository = read("../settings/team-types/teamTypes.repository.js");
  assert.match(core, /department_id/);
  assert.match(actions, /assertAdminActionPermission/);
  assert.match(actions, /hasActiveDepartment/);
  assert.match(repository, /departmentId/);
});

test("team creation and editing use templates from the target department", () => {
  const create = read("../../../app/admin/teams/new/page.js");
  const edit = read("../../../app/admin/teams/edit/[id]/page.js");
  const actions = read("../../../app/admin/teams/actions.js");
  assert.match(create, /departmentId: effectiveDepartmentId/);
  assert.match(edit, /departmentId: team\.department_id/);
  assert.match(actions, /templateResult\.data\.department_id !== validatedDepartment\.data/);
});

test("table tennis board uses six shared roles and enforces them server-side", () => {
  const create = read("../../../app/admin/department/board/new/page.js");
  const edit = read("../../../app/admin/department/board/edit/[id]/page.js");
  const actions = read("../../../app/admin/department/board/actions.js");
  for (const source of [create, edit, actions]) {
    for (const slug of ["erster-vorsitzender", "zweiter-vorsitzender", "erster-geschaeftsfuehrer", "zweiter-geschaeftsfuehrer", "kassenwart", "stellvertretender-kassenwart"]) assert.match(source, new RegExp(slug));
  }
  assert.match(actions, /roleResult\.data\.department_id !== departmentId/);
  assert.match(actions, /TABLE_TENNIS_SHARED_ROLE_SLUGS/);
});

test("table tennis hides football competition and goalkeeper coach contracts", () => {
  assert.match(read("../teams/forms/tabs/TeamCompetitionTab.js"), /departmentSlug === "tischtennis"/);
  assert.match(read("../coaches/forms/fields/CoachRoleFields.js"), /role !== "Torwarttrainer"/);
  assert.match(read("../../../app/admin/coaches/actions.js"), /Torwarttrainer ist im Tischtennisbereich nicht zulässig/);
});

test("team roster option loaders reject current cross-department people", () => {
  assert.match(read("../teams/teamEditPlayer.repository.js"), /departmentByTeamId/);
  assert.match(read("../teams/teamEditCoach.repository.js"), /inDepartmentCoachIds/);
  const actions = read("../../../app/admin/teams/actions.js");
  assert.match(actions, /hasPersonsWithoutDepartmentAssignment/);
  assert.match(actions, /Der Kader enthält Spieler ohne aktive Zuordnung zu dieser Abteilung/);
});
