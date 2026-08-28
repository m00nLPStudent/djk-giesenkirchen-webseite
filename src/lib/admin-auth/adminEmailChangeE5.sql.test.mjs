import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const preflight = readFileSync(
  new URL("../../../docs/sql/b15-23e5-auth-email-self-service-hardening-preflight-readonly.sql", import.meta.url),
  "utf8",
);
const liveAnalysis = readFileSync(
  new URL("../../../docs/planning/b15-23e5-auth-email-self-service-hardening-live-preflight-analysis.md", import.meta.url),
  "utf8",
);
const compensationDesign = readFileSync(
  new URL("../../../docs/planning/b15-23e5-auth-email-compensation-state-design.md", import.meta.url),
  "utf8",
);
const mutationSnapshot = readFileSync(
  new URL("../../../docs/sql/b15-23e5-auth-email-mutation-diff-readonly.sql", import.meta.url),
  "utf8",
);
const cleanupProposal = readFileSync(
  new URL("../../../docs/sql/b15-23e5-pending-self-service-email-cleanup-proposal.sql", import.meta.url),
  "utf8",
);
const cleanupPostcheck = readFileSync(
  new URL("../../../docs/sql/b15-23e5-pending-self-service-email-cleanup-postcheck-readonly.sql", import.meta.url),
  "utf8",
);
const compensationPreflight = readFileSync(
  new URL("../../../docs/sql/b15-23e5-compensation-state-preflight-readonly.sql", import.meta.url),
  "utf8",
);
const compensationProposal = readFileSync(
  new URL("../../../docs/sql/b15-23e5-compensation-state-proposal.sql", import.meta.url),
  "utf8",
);
const compensationRollback = readFileSync(
  new URL("../../../docs/sql/b15-23e5-compensation-state-rollback.sql", import.meta.url),
  "utf8",
);
const compensationPostcheck = readFileSync(
  new URL("../../../docs/sql/b15-23e5-compensation-state-postcheck-readonly.sql", import.meta.url),
  "utf8",
);

test("E5 preflight is transactionally read-only and contains no mutating statement", () => {
  assert.match(preflight, /BEGIN TRANSACTION READ ONLY;/i);
  assert.match(preflight, /COMMIT;/i);
  assert.doesNotMatch(preflight, /^\s*(?:ALTER|CREATE|DROP|GRANT|REVOKE|INSERT|UPDATE|DELETE|TRUNCATE|DO|CALL)\b/im);
});

test("E5 preflight safely filters normal functions before pg_get_functiondef", () => {
  assert.match(preflight, /WITH normal_functions AS MATERIALIZED[\s\S]*p\.prokind='f'[\s\S]*pg_get_functiondef\(f\.oid\)/i);
  assert.match(preflight, /WITH trigger_functions AS MATERIALIZED[\s\S]*p\.prokind='f'[\s\S]*pg_get_functiondef\(f\.oid\)/i);
});

test("E5 preflight inventories pending state only as aggregate counts", () => {
  assert.match(preflight, /users_with_pending_email_change/i);
  assert.match(preflight, /GROUP BY status/i);
  assert.doesNotMatch(preflight, /SELECT\s+(?:u\.)?(?:id|email|email_change)\b/i);
});

test("E5 live analysis records the role boundary and keeps the guard stopped on compensation state", () => {
  assert.match(liveAnalysis, /26.*interne.*FK-Constraint-Trigger/is);
  assert.match(liveAnalysis, /supabase_auth_admin/is);
  assert.match(liveAnalysis, /Rollenunterscheidung[\s\S]*ungeeignet/is);
  assert.match(liveAnalysis, /atomar gesetzter und verifizierter `compensating`-Status/is);
});

test("E5 stop gate leaves proposal, rollback and postcheck absent", () => {
  const sqlDir = new URL("../../../docs/sql/", import.meta.url);
  for (const suffix of ["proposal.sql", "rollback.sql", "postcheck-readonly.sql"]) {
    assert.equal(existsSync(new URL(`b15-23e5-auth-email-self-service-hardening-${suffix}`, sqlDir)), false);
  }
});

test("mutation snapshot is read-only, placeholder-bound and returns no identity or token values", () => {
  assert.match(mutationSnapshot, /BEGIN TRANSACTION READ ONLY/i);
  assert.match(mutationSnapshot, /NULL::uuid AS test_user_id/i);
  assert.match(mutationSnapshot, /active_email_matches_expected_old/i);
  assert.match(mutationSnapshot, /pending_email_matches_expected_new/i);
  assert.match(mutationSnapshot, /confirming_within_ttl_present/i);
  assert.doesNotMatch(mutationSnapshot, /^\s*(?:ALTER|CREATE|DROP|GRANT|REVOKE|INSERT|UPDATE|DELETE|TRUNCATE|DO|CALL)\b/im);
  assert.doesNotMatch(mutationSnapshot, /\bemail\s+AS\s+(?:email|active_email)\b/i);
  assert.doesNotMatch(mutationSnapshot, /\bemail_change_token_(?:new|current)\s+AS\b/i);
  assert.doesNotMatch(mutationSnapshot, /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
});

test("pending cleanup is one-user guarded and its postcheck remains sanitized read-only", () => {
  assert.match(cleanupProposal, /v_test_user_id uuid := NULL/i);
  assert.match(cleanupProposal, /active E3 request exists[\s\S]*stop without changes/i);
  assert.match(cleanupProposal, /UPDATE auth\.users[\s\S]*email_change=''[\s\S]*email_change_confirm_status=0/i);
  assert.match(cleanupProposal, /expected exactly one pending test-user email change/i);
  assert.match(cleanupPostcheck, /BEGIN TRANSACTION READ ONLY/i);
  assert.match(cleanupPostcheck, /NULL::uuid AS test_user_id/i);
  assert.doesNotMatch(cleanupPostcheck, /^\s*(?:ALTER|CREATE|DROP|GRANT|REVOKE|INSERT|UPDATE|DELETE|TRUNCATE|DO|CALL)\b/im);
});

test("E5.2.2 classifies the guard as blocked on an explicit compensation claim", () => {
  assert.match(liveAnalysis, /B\s*[–-]\s*kleine kontrollierte Vorarbeit nötig/i);
  assert.match(compensationDesign, /confirming\|completed\s*→\s*compensating/i);
  assert.match(compensationDesign, /Mehrdeutige Claims sind fail-closed/i);
  assert.match(compensationDesign, /completed.*allein berechtigt niemals zum Reverse/is);
  assert.match(compensationDesign, /zeitlich begrenztes `completed`-Allow ist keine robuste Sicherheitsgrenze/i);
});

test("E5.2.2 leaves product guard artifacts absent until the state-machine prerequisite", () => {
  const sqlDir = new URL("../../../docs/sql/", import.meta.url);
  for (const suffix of ["proposal.sql", "rollback.sql", "postcheck-readonly.sql"]) {
    assert.equal(existsSync(new URL(`b15-23e5-auth-email-self-service-hardening-${suffix}`, sqlDir)), false);
  }
  assert.match(compensationDesign, /weder Schema noch Produktcode geändert/i);
});

test("E5.2.3 compensation preflight is sanitized, read-only and complete", () => {
  assert.match(compensationPreflight, /BEGIN TRANSACTION READ ONLY/i);
  assert.match(compensationPreflight, /compensation_started_at_count/i);
  assert.match(compensationPreflight, /unknown_status_count/i);
  assert.match(compensationPreflight, /admin_email_change_requests_one_active_user_idx|index_definition/i);
  assert.match(compensationPreflight, /role_table_grants/i);
  assert.match(compensationPreflight, /has_table_privilege/i);
  assert.match(compensationPreflight, /WITH normal_functions AS MATERIALIZED[\s\S]*p\.prokind='f'[\s\S]*pg_get_functiondef\(f\.oid\)/i);
  assert.doesNotMatch(compensationPreflight, /^\s*(?:ALTER|CREATE|DROP|GRANT|REVOKE|INSERT|UPDATE|DELETE|TRUNCATE|DO|CALL)\b/im);
  assert.doesNotMatch(compensationPreflight, /SELECT\s+(?:id|user_id|old_email|new_email|token_hash)\b/i);
});

test("E5.2.4 proposal is transactional, fail-closed and adds only the compensation state", () => {
  assert.match(compensationProposal, /BEGIN;[\s\S]*COMMIT;/i);
  assert.match(compensationProposal, /compensation_started_at already exists; stop/i);
  assert.match(compensationProposal, /unknown request status exists; stop/i);
  assert.match(compensationProposal, /ADD COLUMN compensation_started_at timestamptz NULL/i);
  assert.match(compensationProposal, /status IN \('pending','confirming','compensating','completed','cancelled','expired','failed'\)/i);
  assert.match(compensationProposal, /status='compensating'[\s\S]*compensation_started_at IS NOT NULL/i);
  assert.match(compensationProposal, /status='failed'[\s\S]*failure_code IS NOT NULL/i);
  assert.match(compensationProposal, /WHERE status IN \('pending','confirming','compensating'\)/i);
  assert.doesNotMatch(compensationProposal, /^\s*(?:CREATE\s+POLICY|GRANT\s)|SECURITY\s+DEFINER/im);
});

test("E5.2.4 rollback preserves compensation audit and restores the exact old status/index contract", () => {
  assert.match(compensationRollback, /status='compensating'[\s\S]*preserve state and stop/i);
  assert.match(compensationRollback, /status='failed' AND compensation_started_at IS NOT NULL[\s\S]*preserve audit and stop/i);
  assert.match(compensationRollback, /DROP COLUMN compensation_started_at/i);
  assert.match(compensationRollback, /status IN \('pending','confirming','completed','cancelled','expired','failed'\)/i);
  assert.match(compensationRollback, /WHERE status IN \('pending','confirming'\)/i);
});

test("E5.2.4 postcheck remains read-only, sanitized and verifies security plus state integrity", () => {
  assert.match(compensationPostcheck, /BEGIN TRANSACTION READ ONLY/i);
  assert.match(compensationPostcheck, /compensation_column_contract_valid/i);
  assert.match(compensationPostcheck, /no_client_privileges/i);
  assert.match(compensationPostcheck, /service_role_crud_ok/i);
  assert.match(compensationPostcheck, /unknown_status_count/i);
  assert.match(compensationPostcheck, /invalid_state_count/i);
  assert.doesNotMatch(compensationPostcheck, /^\s*(?:ALTER|CREATE|DROP|GRANT|REVOKE|INSERT|UPDATE|DELETE|TRUNCATE|DO|CALL)\b/im);
  assert.doesNotMatch(compensationPostcheck, /SELECT\s+(?:id|user_id|old_email|new_email|token_hash)\b/i);
});
