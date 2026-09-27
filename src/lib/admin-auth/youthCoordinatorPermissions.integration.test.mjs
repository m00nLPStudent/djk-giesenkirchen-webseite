import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("permission proposal is narrowly scoped and preserves the team RLS contract", async () => {
  const proposal = await read("../../../docs/sql/b15-youth-coordinator-permissions-proposal.sql");
  assert.match(proposal, /^BEGIN;/m);
  assert.match(proposal, /COMMIT;\s*$/);
  assert.match(proposal, /role_row\.key = 'jugendleiter'/);
  assert.match(proposal, /permission_row\.key = 'settings\.view'/);
  for (const permission of ["view", "create", "edit", "delete", "publish"]) {
    assert.match(proposal, new RegExp(`results\\.${permission}`));
  }
  assert.doesNotMatch(proposal, /\('teams\.create'\)/);
  assert.doesNotMatch(proposal, /ALTER\s+TABLE|CREATE\s+POLICY|DROP\s+POLICY/i);
});

test("rollback restores only the confirmed youth permission baseline", async () => {
  const rollback = await read("../../../docs/sql/b15-youth-coordinator-permissions-rollback.sql");
  assert.match(rollback, /^BEGIN;/m);
  assert.match(rollback, /COMMIT;\s*$/);
  assert.match(rollback, /permission_row\.key = 'settings\.view'/);
  assert.match(rollback, /permission_row\.key LIKE 'results\.%'/);
  assert.doesNotMatch(rollback, /ALTER\s+TABLE|CREATE\s+POLICY|DROP\s+POLICY/i);
});

test("postcheck stays read-only and verifies the complete youth target", async () => {
  const postcheck = await read("../../../docs/sql/b15-youth-coordinator-permissions-postcheck-readonly.sql");
  assert.match(postcheck, /'overall_ok'/);
  assert.match(postcheck, /insert_contract_uses_teams_create/);
  assert.match(postcheck, /update_contract_uses_teams_edit/);
  assert.match(postcheck, /settings_view_removed/);
  assert.match(postcheck, /all_results_permissions_present/);
  assert.doesNotMatch(postcheck, /^\s*(INSERT|UPDATE|DELETE|ALTER|CREATE|DROP|TRUNCATE|GRANT|REVOKE|MERGE|CALL|DO)\b/im);
});

test("settings remains permission-driven without a youth role exception", async () => {
  const [navigation, settingsPage, contactActions] = await Promise.all([
    read("../../components/admin/navigation/adminNavigation.config.js"),
    read("../../app/admin/settings/page.js"),
    read("../../app/admin/settings/contacts/actions.js"),
  ]);
  assert.match(navigation, /"settings\.view"/);
  assert.match(settingsPage, /requiredPermission: "settings\.view"/);
  assert.match(contactActions, /requiredPermission: "settings\.edit"/);
  for (const source of [navigation, settingsPage, contactActions]) {
    assert.doesNotMatch(source, /role\s*===\s*["']jugendleiter/);
  }
});

test("results scope is centralized and youth access is football-only", async () => {
  const [core, service] = await Promise.all([
    read("../../components/admin/results/results.core.mjs"),
    read("../../components/admin/results/results.service.js"),
  ]);
  assert.match(core, /canAccessYouthAll/);
  assert.match(core, /return \["fussball"\]/);
  assert.match(service, /resolveResultDepartmentSlugs\(loaded\.context\)/);
  assert.match(service, /canAccessResultTeamSeason\(scope\.context/);
});

test("full save authorizes create before insert and never uses team-season upsert", async () => {
  const [actions, service] = await Promise.all([
    read("../../app/admin/teams/actions.js"),
    read("../../components/admin/teams/services/teams.service.js"),
  ]);
  const authorization = actions.indexOf("!existingTeamSeason && !canCreateTeamSeason");
  const save = actions.indexOf("saveTeamWithSeason(teamPayload || {}, teamId");
  assert.ok(authorization >= 0 && authorization < save);
  assert.match(service, /writeContract\.operation === "update"/);
  assert.match(service, /\.insert\(teamSeasonPayload\)/);
  assert.doesNotMatch(service, /\.from\("team_seasons"\)[\s\S]{0,180}\.upsert\(/);
});
