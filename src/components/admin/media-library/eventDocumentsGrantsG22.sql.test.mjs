import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const proposal = read("../../../../docs/sql/b15-19g2-2-event-documents-table-grants-hardening-proposal.sql");
const postcheck = read("../../../../docs/sql/b15-19g2-2-event-documents-table-grants-hardening-postcheck-readonly.sql");
const rollback = read("../../../../docs/sql/b15-19g2-2-event-documents-table-grants-hardening-rollback.sql");
const g21Postcheck = read("../../../../docs/sql/b15-19g2-1-event-documents-rls-hardening-postcheck-readonly.sql");

test("G2.2 removes every non-read table privilege from browser roles", () => {
  assert.match(proposal, /BEGIN;/);
  assert.match(proposal, /REVOKE INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER/);
  assert.match(proposal, /FROM anon,authenticated/);
  assert.match(proposal, /GRANT SELECT/);
  assert.doesNotMatch(proposal, /service_role/);
  assert.doesNotMatch(proposal, /INSERT INTO|UPDATE public\.|DELETE FROM|storage\./);
  assert.match(proposal, /COMMIT;/);
});

test("postcheck covers all seven privileges and preserves RLS diagnostics", () => {
  for (const privilege of ["SELECT", "INSERT", "UPDATE", "DELETE", "TRUNCATE", "REFERENCES", "TRIGGER"]) assert.match(postcheck, new RegExp(`'${privilege}'`));
  for (const marker of ["relrowsecurity", "event_documents_public_read", "no_direct_client_write_policies", "event_documents_media_asset_id_fkey", "cleanup_event_document_media_usage", "synchronize_media_assignment"]) assert.match(postcheck, new RegExp(marker));
  assert.match(postcheck, /r\.routine_name/);
  assert.match(postcheck, /ORDER BY r\.routine_name,p\.grantee/);
});

test("G2.1 ambiguous routine columns are qualified", () => {
  assert.match(g21Postcheck, /SELECT r\.routine_name,r\.security_type,p\.grantee,p\.privilege_type/);
  assert.match(g21Postcheck, /ORDER BY r\.routine_name,p\.grantee/);
});

test("rollback restores only the three G2.2 privileges and warns about degradation", () => {
  assert.match(rollback, /SECURITY WARNING/);
  assert.match(rollback, /GRANT TRUNCATE,REFERENCES,TRIGGER/);
  assert.doesNotMatch(rollback, /GRANT (SELECT|INSERT|UPDATE|DELETE)/);
  assert.doesNotMatch(rollback, /INSERT INTO|UPDATE public\.|DELETE FROM|storage\./);
});
