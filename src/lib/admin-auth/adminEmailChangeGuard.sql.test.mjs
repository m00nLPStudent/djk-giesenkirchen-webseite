import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const preflight = readFileSync(
  new URL("../../../docs/sql/b15-23e5-auth-users-email-guard-preflight-readonly.sql", import.meta.url),
  "utf8",
);
const proposal = readFileSync(
  new URL("../../../docs/sql/b15-23e5-auth-users-email-guard-proposal.sql", import.meta.url),
  "utf8",
);
const rollback = readFileSync(
  new URL("../../../docs/sql/b15-23e5-auth-users-email-guard-rollback.sql", import.meta.url),
  "utf8",
);
const postcheck = readFileSync(
  new URL("../../../docs/sql/b15-23e5-auth-users-email-guard-postcheck-readonly.sql", import.meta.url),
  "utf8",
);

test("E5.3 guard preflight is read-only and sanitized", () => {
  assert.match(preflight, /BEGIN TRANSACTION READ ONLY/i);
  assert.match(preflight, /COMMIT;/i);
  assert.doesNotMatch(preflight, /^\s*(?:INSERT|UPDATE|DELETE|TRUNCATE|ALTER|CREATE|DROP|GRANT|REVOKE)\b/im);
  assert.doesNotMatch(preflight, /SELECT\s+(?:u\.)?(?:id|email|email_change_token)/i);
  assert.match(preflight, /count\(\*\).*users_with_email_change/is);
});

test("E5.3 guard preflight inventories managed auth and workflow prerequisites", () => {
  assert.match(preflight, /auth\.users/);
  assert.match(preflight, /admin_email_change_requests/);
  assert.match(preflight, /pg_get_triggerdef/);
  assert.match(preflight, /NOT t\.tgisinternal/);
  assert.match(preflight, /supabase_auth_admin/);
  assert.match(preflight, /has_table_privilege/);
  assert.match(preflight, /compensation_started_at/);
  assert.match(preflight, /admin_email_change_requests_one_active_user_idx/);
  assert.match(preflight, /users_with_inconsistent_pending_presence/);
});

test("E5.3 guard preflight safely limits function definition inspection", () => {
  assert.match(preflight, /WITH trigger_functions AS MATERIALIZED[\s\S]*p\.prokind = 'f'[\s\S]*pg_catalog\.pg_get_functiondef\(f\.oid\)/i);
});

test("E5.3.1 proposal is transactional, fail-closed and preserves managed auth", () => {
  assert.match(proposal, /BEGIN;[\s\S]*COMMIT;/i);
  assert.match(proposal, /unexpected_auth_users_contract/);
  assert.match(proposal, /native_pending_email_state_exists/);
  assert.match(proposal, /guard_function_name_collision/);
  assert.match(proposal, /guard_trigger_name_collision/);
  assert.match(proposal, /unexpected_auth_admin_request_select/);
  assert.doesNotMatch(proposal, /ALTER TABLE\s+auth\.users/i);
  assert.doesNotMatch(proposal, /GRANT\s+SELECT[\s\S]*supabase_auth_admin/i);
});

test("E5.3.1 function has a narrow hardened security-definer contract", () => {
  assert.match(proposal, /CREATE FUNCTION public\.guard_admin_controlled_auth_email_change\(\)[\s\S]*RETURNS trigger[\s\S]*SECURITY DEFINER[\s\S]*SET search_path = pg_catalog/i);
  assert.match(proposal, /ALTER FUNCTION public\.guard_admin_controlled_auth_email_change\(\) OWNER TO postgres/i);
  for (const role of ["PUBLIC", "anon", "authenticated", "service_role"]) {
    assert.match(proposal, new RegExp(`REVOKE ALL ON FUNCTION public\\.guard_admin_controlled_auth_email_change\\(\\) FROM ${role}`, "i"));
  }
  assert.match(proposal, /FROM public\.admin_email_change_requests AS r/i);
  assert.doesNotMatch(proposal, /\bEXECUTE\s+(?:IMMEDIATE|format)\b/i);
});

test("E5.3.1 trigger fires only before relevant email updates", () => {
  assert.match(proposal, /CREATE TRIGGER guard_admin_controlled_email_change\s+BEFORE UPDATE ON auth\.users\s+FOR EACH ROW\s+WHEN \(/i);
  assert.doesNotMatch(proposal, /BEFORE INSERT ON auth\.users/i);
  for (const field of ["email", "email_change", "email_change_token_new", "email_change_token_current", "email_change_confirm_status", "email_change_sent_at"]) {
    assert.match(proposal, new RegExp(`OLD\\.${field} IS DISTINCT FROM NEW\\.${field}`));
  }
  assert.doesNotMatch(proposal, /OLD\.(?:encrypted_password|recovery_token|raw_user_meta_data|phone)\s+IS DISTINCT/i);
});

test("E5.3.1 guard blocks native/mixed mutations and allows exactly one workflow direction", () => {
  assert.match(proposal, /IF NOT v_email_changed OR v_pending_changed THEN[\s\S]*controlled_email_change_required/i);
  assert.match(proposal, /r\.status = 'confirming'[\s\S]*r\.confirmed_at <= r\.expires_at[\s\S]*r\.compensation_started_at IS NULL/i);
  assert.match(proposal, /r\.status = 'compensating'[\s\S]*r\.compensation_started_at IS NOT NULL/i);
  assert.match(proposal, /v_forward_matches \+ v_reverse_matches <> 1/i);
  assert.match(proposal, /r\.user_id = NEW\.id/i);
  assert.match(proposal, /lower\(pg_catalog\.btrim\(r\.old_email\)\)/i);
  assert.doesNotMatch(proposal, /LIMIT\s+1|FOR\s+(?:UPDATE|SHARE)/i);
  assert.doesNotMatch(proposal, /MESSAGE\s*=\s*[^;]*(?:OLD\.email|NEW\.email|r\.status)/i);
});

test("E5.3.1 rollback removes only an exactly verified project guard", () => {
  assert.match(rollback, /BEGIN;[\s\S]*unexpected_guard_function_contract[\s\S]*unexpected_guard_trigger_contract/i);
  assert.match(rollback, /DROP TRIGGER guard_admin_controlled_email_change ON auth\.users/i);
  assert.match(rollback, /DROP FUNCTION public\.guard_admin_controlled_auth_email_change\(\)/i);
  assert.doesNotMatch(rollback, /(?:UPDATE|DELETE|INSERT|TRUNCATE)\s+(?:auth\.users|public\.admin_email_change_requests)/i);
});

test("E5.3.1 postcheck is read-only, sanitized and verifies the complete guard boundary", () => {
  assert.match(postcheck, /BEGIN TRANSACTION READ ONLY/i);
  assert.match(postcheck, /internal_trigger_count_ok/);
  assert.match(postcheck, /guard_trigger_ok/);
  assert.match(postcheck, /guard_function_ok/);
  assert.match(postcheck, /public_execute_revoked/);
  assert.match(postcheck, /service_role_execute_revoked/);
  assert.match(postcheck, /request_boundary_ok/);
  assert.match(postcheck, /no_native_pending_state/);
  assert.doesNotMatch(postcheck, /^\s*(?:INSERT|UPDATE|DELETE|TRUNCATE|ALTER|CREATE|DROP|GRANT|REVOKE|DO|CALL)\b/im);
  assert.doesNotMatch(postcheck, /SELECT\s+(?:u\.)?(?:id|email|email_change_token)/i);
});
