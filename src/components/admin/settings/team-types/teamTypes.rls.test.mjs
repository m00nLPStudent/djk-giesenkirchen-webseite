import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sql = (name) => readFileSync(new URL(`../../../../../docs/sql/${name}`, import.meta.url), "utf8");
const mutationAtLineStart = /^\s*(create|alter|drop|insert|update|delete|grant|revoke|truncate|do|begin|commit)\b/im;

test("preflight and G3 postcheck are read only", () => {
  assert.doesNotMatch(sql("b15-16g1-team-templates-rls-preflight-readonly.sql"), mutationAtLineStart);
  assert.doesNotMatch(sql("b15-16g3-team-templates-rls-postcheck-readonly.sql"), mutationAtLineStart);
});

test("G3 policies use the existing profile role and permission relations", () => {
  const proposal = sql("b15-16g3-team-templates-rls-proposal.sql");
  for (const operation of ["insert", "update", "delete"]) assert.match(proposal, new RegExp(`team_templates_${operation}_settings_edit`));
  assert.equal((proposal.match(/auth\.role\(\) = 'authenticated'/g) || []).length, 4);
  for (const table of ["admin_profiles", "admin_user_roles", "admin_roles", "admin_role_permissions", "admin_permissions"]) assert.match(proposal, new RegExp(table));
  assert.match(proposal, /profile\.id = auth\.uid\(\)/);
  assert.match(proposal, /lower\(profile\.email\) = lower\(auth\.jwt\(\)->>'email'\)/);
  assert.match(proposal, /role_record\.key = 'superadmin'/);
  assert.match(proposal, /permission_record\.key = 'settings\.edit'/);
  assert.doesNotMatch(proposal, /app_metadata|current_admin_has_permission|service_role/i);
  assert.doesNotMatch(proposal, /(?:using|with check)\s*\(\s*true\s*\)/i);
  assert.doesNotMatch(proposal, /disable\s+row\s+level\s+security/i);
  assert.doesNotMatch(proposal, /\b(grant|revoke|alter table|create table)\b/i);
  assert.doesNotMatch(proposal, /for\s+select/i);
});

test("rollback is limited to the additive policies", () => {
  const rollback = sql("b15-16g3-team-templates-rls-rollback.sql");
  assert.equal((rollback.match(/drop policy/gi) || []).length, 3);
  assert.doesNotMatch(rollback, /drop\s+(table|function)|disable\s+row/i);
});
