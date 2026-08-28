import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const postcheck = readFileSync(
  new URL("../../../docs/sql/b15-23e-final-postcheck-readonly.sql", import.meta.url),
  "utf8",
);

test("final B15.23E postcheck is read-only and contains no identity output", () => {
  assert.match(postcheck, /BEGIN TRANSACTION READ ONLY/i);
  assert.match(postcheck, /COMMIT;/i);
  assert.doesNotMatch(postcheck, /^\s*(?:INSERT|UPDATE|DELETE|TRUNCATE|ALTER|CREATE|DROP|GRANT|REVOKE|DO|CALL)\b/im);
  assert.doesNotMatch(postcheck, /SELECT\s+(?:u\.)?(?:id|email|email_change_token)/i);
  assert.doesNotMatch(postcheck, /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
});

test("final B15.23E postcheck covers guard, request security and compensation", () => {
  assert.match(postcheck, /guard_admin_controlled_email_change/);
  assert.match(postcheck, /security_definer/);
  assert.match(postcheck, /search_path=pg_catalog/);
  assert.match(postcheck, /auth_admin_request_select_denied/);
  assert.match(postcheck, /service_role_crud_ok/);
  assert.match(postcheck, /compensation_column_ok/);
  assert.match(postcheck, /status_constraint_ok/);
  assert.match(postcheck, /active_unique_index_ok/);
});

test("final B15.23E postcheck covers pending, profile and active-request integrity", () => {
  assert.match(postcheck, /users_with_email_change_token_new/);
  assert.match(postcheck, /users_with_nonzero_email_change_confirm_status/);
  assert.match(postcheck, /auth_users_without_profile/);
  assert.match(postcheck, /auth_profile_email_mismatches/);
  assert.match(postcheck, /profiles_without_auth_user/);
  assert.match(postcheck, /active_request_count/);
  assert.match(postcheck, /no_active_requests/);
});
