import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

const read = (path) => fs.readFile(new URL(path, import.meta.url), "utf8");
const [action, page, repository, navigation] = await Promise.all([
  read("../../../app/admin/system/structure/actions.js"),
  read("../../../app/admin/system/structure/page.js"),
  read("./structureAssignment.repository.js"),
  read("../navigation/adminNavigation.config.js"),
]);

test("structure center and assignments are superadmin-only server primitives", () => {
  assert.match(page, /assertSuperadminActionPermission/);
  assert.match(action, /assertSuperadminActionPermission/);
  assert.match(action, /createSupabaseAdminClient/);
  assert.doesNotMatch(action, /assertAdminActionPermission\s*\(/);
  assert.match(navigation, /structure-assignment[\s\S]*superadmin_only/);
});

test("assignment validates active target, relations and stale unassigned state", () => {
  assert.match(action, /loadActiveDepartment[\s\S]*validateRelationCompatibility/);
  assert.match(action, /isUnassignedStructureRecord/);
  assert.match(repository, /\.is\("department_id", null\)/);
  assert.match(repository, /\.eq\("organization_scope", "unassigned"\)/);
  assert.match(action, /result\.data \|\| \[\]\)\.length !== 1/);
});

test("no automatic relation backfill is part of structure assignment", () => {
  assert.doesNotMatch(action + repository, /\.from\("(?:player_team_seasons|coach_team_seasons)"\)\.update/);
  assert.doesNotMatch(action + repository, /\.from\("(?:player_team_seasons|coach_team_seasons)"\)\.insert/);
});

test("legacy relation conflicts are visible and only the exact active relation can be deactivated", () => {
  assert.match(page, /loadStructureRelationConflicts/);
  assert.match(action, /removeStructureRelationConflictAction/);
  assert.match(action, /assertSuperadminActionPermission/);
  assert.match(repository, /\.update\(\{ is_active: false \}\)\.eq\("id", input\.relationId\)\.eq\(personColumn, input\.entityId\)\.eq\("is_active", true\)/);
  assert.match(action, /normalizeStructureRelationConflict\(entityType, relation\)/);
  assert.match(action, /Die Zuordnung ist nicht mehr als Konflikt vorhanden/);
  assert.doesNotMatch(action + repository, /from\("players"\)\.delete|from\("coaches"\)\.delete/);
});
