import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("team create and edit load active departments into the existing form", async () => {
  const [createPage, editPage, repository] = await Promise.all([
    read("../../../app/admin/teams/new/page.js"),
    read("../../../app/admin/teams/edit/[id]/page.js"),
    read("services/teamDepartments.repository.js"),
  ]);
  for (const page of [createPage, editPage]) {
    assert.match(page, /loadActiveTeamDepartments/);
    assert.match(page, /departments=\{scopedDepartments\}/);
    assert.match(page, /scopeContext\.managedDepartmentId/);
  }
  assert.match(repository, /\.eq\("is_active", true\)/);
  assert.match(repository, /import "server-only"/);
});

test("department is required in the UI and persisted in the team payload", async () => {
  const [form, baseTab, initialState, service] = await Promise.all([
    read("forms/AdminTeamsForm.js"),
    read("forms/tabs/TeamBaseTab.js"),
    read("forms/helpers/teamFormInitialState.js"),
    read("services/teams.service.js"),
  ]);
  assert.match(baseTab, /label="Abteilung"[\s\S]*required/);
  assert.match(baseTab, /Abteilung fehlt/);
  assert.match(form, /if \(!form\.department_id\)/);
  assert.match(initialState, /department_id: team\?\.department_id \|\| ""/);
  assert.match(service, /department_id: team\.department_id \|\| null/);
});

test("server action rejects malformed, missing and inactive departments after permission and scope checks", async () => {
  const [action, core] = await Promise.all([
    read("../../../app/admin/teams/actions.js"),
    read("services/teamDepartments.core.mjs"),
  ]);
  const authorization = action.indexOf("loadAuthorizedTeamMutationContext(requiredPermission)");
  const scope = action.indexOf("canAccessTeamOnServer(scopeContext, existingTeam)");
  const validation = action.indexOf("validateTeamDepartmentId(teamPayload?.department_id)");
  const save = action.indexOf("saveTeamWithSeason(teamPayload || {}, teamId");
  assert.ok(authorization >= 0 && scope > authorization && validation > scope && save > validation);
  assert.match(action, /findTeamDepartmentById/);
  assert.match(action, /validateActiveTeamDepartment/);
  assert.match(core, /existiert nicht oder ist inaktiv/);
});
