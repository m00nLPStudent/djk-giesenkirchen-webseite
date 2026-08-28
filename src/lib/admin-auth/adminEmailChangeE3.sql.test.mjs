import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const preflight = read("../../../docs/sql/b15-23e3-admin-email-change-request-preflight-readonly.sql");
const proposal = read("../../../docs/sql/b15-23e3-admin-email-change-request-proposal.sql");
const postcheck = read("../../../docs/sql/b15-23e3-admin-email-change-request-postcheck-readonly.sql");
const grantsFix = read("../../../docs/sql/b15-23e3-admin-email-change-request-grants-fix-proposal.sql");

function assertReadOnlyTransaction(sql) {
  const withoutComments = sql.replace(/^--.*$/gm, "");
  assert.match(withoutComments, /BEGIN TRANSACTION READ ONLY;/i);
  assert.match(withoutComments, /ROLLBACK;/i);
  const statements = withoutComments
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
  assert.equal(
    statements.some((statement) =>
      /^(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|GRANT|REVOKE|TRUNCATE|CALL|DO)\b/i.test(
        statement,
      ),
    ),
    false,
  );
}

test("E3 preflight is transactionally read-only", () => {
  assertReadOnlyTransaction(preflight);
});

test("E3 proposal stores only a bounded hash and enforces one active request", () => {
  assert.match(proposal, /CREATE TABLE public\.admin_email_change_requests/);
  assert.match(proposal, /token_hash text NOT NULL/);
  assert.match(proposal, /token_hash ~ '\^\[0-9a-f\]\{64\}\$'/);
  assert.doesNotMatch(proposal, /plaintext_token|raw_token|confirmation_token text/);
  assert.match(
    proposal,
    /CREATE UNIQUE INDEX admin_email_change_requests_one_active_user_idx[\s\S]*WHERE status IN \('pending', 'confirming'\)/,
  );
  assert.match(
    proposal,
    /status IN \('pending', 'confirming', 'completed', 'cancelled', 'expired', 'failed'\)/,
  );
  assert.match(proposal, /expired_at timestamptz NULL/);
  assert.match(proposal, /status = 'failed'[\s\S]*failure_code IS NOT NULL/);
});

test("E3 proposal is server-only and enables RLS in the same transaction", () => {
  assert.match(proposal, /^BEGIN;/m);
  assert.match(
    proposal,
    /ALTER TABLE public\.admin_email_change_requests ENABLE ROW LEVEL SECURITY;/,
  );
  assert.match(
    proposal,
    /REVOKE ALL PRIVILEGES ON TABLE public\.admin_email_change_requests[\s\S]*FROM PUBLIC, anon, authenticated/,
  );
  assert.match(
    proposal,
    /GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public\.admin_email_change_requests[\s\S]*TO service_role/,
  );
  assert.doesNotMatch(proposal, /CREATE POLICY/);
  assert.match(proposal, /COMMIT;\s*$/);
});

test("E3 postcheck is read-only and verifies the complete server-only contract", () => {
  assertReadOnlyTransaction(postcheck);
  assert.match(postcheck, /relrowsecurity AS rls_enabled/);
  assert.match(postcheck, /pg_get_constraintdef/);
  assert.match(postcheck, /FROM pg_indexes/);
  assert.match(postcheck, /FROM pg_policies/);
  assert.match(postcheck, /has_table_privilege/);
  assert.match(postcheck, /FROM information_schema\.triggers/);
  assert.match(postcheck, /count\(\*\) AS initial_row_count/);
});

test("E3 grants fix removes only the three unneeded service-role privileges", () => {
  assert.match(grantsFix, /^BEGIN;/m);
  assert.match(
    grantsFix,
    /REVOKE REFERENCES, TRIGGER, TRUNCATE[\s\S]*FROM service_role;/,
  );
  assert.doesNotMatch(grantsFix, /REVOKE[\s\S]*(SELECT|INSERT|UPDATE|DELETE)/);
  assert.doesNotMatch(grantsFix, /\b(ALTER TABLE|CREATE|DROP|TRUNCATE TABLE|INSERT INTO|UPDATE public|DELETE FROM)\b/i);
  assert.match(grantsFix, /COMMIT;\s*$/);
});
