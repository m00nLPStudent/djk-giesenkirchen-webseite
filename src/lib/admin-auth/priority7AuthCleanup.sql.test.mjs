import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const dryRun = read("../../../docs/sql/b15-priority7-auth-cleanup-dry-run-readonly.sql");
const postcheck = read("../../../docs/sql/b15-priority7-auth-cleanup-postcheck-readonly.sql");
const executionPlan = read("../../../docs/planning/priority7-auth-cleanup-execution-plan.md");

const mutatingSql = /\b(?:insert|update|delete|merge|truncate|alter|drop|create|grant|revoke)\b\s+(?:into\s+|from\s+|table\s+|policy\s+|function\s+|on\s+)?(?:auth\.|public\.|storage\.)/i;

test("auth cleanup SQL artifacts remain read-only", () => {
  assert.doesNotMatch(dryRun, mutatingSql);
  assert.doesNotMatch(postcheck, mutatingSql);
  assert.doesNotMatch(dryRun + postcheck, /delete\s+from\s+auth\.users/i);
});

test("dry run fails closed on one relational keep operator and five candidates", () => {
  assert.match(dryRun, /JOIN auth\.users au ON au\.id = ap\.id/);
  assert.match(dryRun, /ar\.key = 'superadmin'/);
  assert.match(dryRun, /ap\.is_active IS TRUE/);
  assert.match(dryRun, /ar\.is_active IS TRUE/);
  assert.match(dryRun, /keep_operator_count/);
  assert.match(dryRun, /delete_candidate_count/);
  assert.match(dryRun, /exactly_one_keep_operator/);
  assert.match(dryRun, /exactly_five_delete_candidates/);
  assert.match(dryRun, /P7A\.04_AUTH_PROFILE_FOREIGN_KEYS/);
});

test("postcheck protects identity, foundation and retained audit", () => {
  assert.match(postcheck, /exactly_one_auth_user/);
  assert.match(postcheck, /no_non_operator_auth_users/);
  assert.match(postcheck, /keep_superadmin_binding_present/);
  assert.match(postcheck, /count\(\*\) FROM public\.admin_roles\) = 13/);
  assert.match(postcheck, /count\(\*\) FROM public\.admin_permissions\) = 64/);
  assert.match(postcheck, /count\(\*\) FROM public\.admin_role_permissions\) = 249/);
  assert.match(postcheck, /count\(\*\) FROM public\.notification_audit\) = 25/);
  assert.match(postcheck, /count\(\*\) FROM public\.media_assets\) = 33/);
  assert.match(postcheck, /count\(\*\) FROM public\.media_asset_usages\) = 11/);
  assert.match(postcheck, /entity_type='admin_profile' AND field_name='avatar'/);
});

test("execution plan requires sequential Admin API deletion without identifiers", () => {
  assert.match(executionPlan, /auth\.admin\.deleteUser\(userId\)/);
  assert.match(executionPlan, /Kein `Promise\.all`, kein Bulk-Delete/);
  assert.match(executionPlan, /nach jedem einzelnen Delete/i);
  assert.match(executionPlan, /keine UUID, E-Mail/i);
  assert.doesNotMatch(executionPlan, /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
  assert.doesNotMatch(executionPlan, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
});
