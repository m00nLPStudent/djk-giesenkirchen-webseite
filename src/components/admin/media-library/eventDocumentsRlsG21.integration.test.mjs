import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const actions = read("../../../app/admin/events/actions.js");
const proposal = read("../../../../docs/sql/b15-19g2-1-event-documents-rls-hardening-proposal.sql");
const postcheck = read("../../../../docs/sql/b15-19g2-1-event-documents-rls-hardening-postcheck-readonly.sql");
const rollback = read("../../../../docs/sql/b15-19g2-1-event-documents-rls-hardening-rollback.sql");

test("event document writes remain behind events permission checks and use the server-only admin client", () => {
  assert.match(actions, /assertAdminActionPermission\(\{ requiredPermission: "events\.edit" \}\)/);
  assert.match(actions, /createSupabaseAdminClient/);
  assert.match(actions, /getEventDocumentAdminClient/);
  assert.doesNotMatch(actions, /auth\.supabaseServer\.from\("event_documents"\)\.(insert|update|delete)/);
  assert.doesNotMatch(actions, /permission\.supabaseServer\.from\("event_documents"\)\.(insert|update|delete)/);
});

test("hardening removes client write policies and table grants while preserving public reads and service role", () => {
  for (const operation of ["insert", "update", "delete"]) assert.match(proposal, new RegExp(`DROP POLICY IF EXISTS event_documents_admin_${operation}`));
  assert.match(proposal, /REVOKE INSERT,UPDATE,DELETE ON TABLE public\.event_documents FROM anon,authenticated/);
  assert.match(proposal, /GRANT SELECT ON TABLE public\.event_documents TO anon,authenticated/);
  assert.match(proposal, /GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE public\.event_documents TO service_role/);
  assert.match(proposal, /event_documents_public_read/);
  assert.match(proposal, /is_public=true/);
  assert.match(proposal, /e\.is_published=true/);
  assert.doesNotMatch(proposal, /INSERT INTO|UPDATE public\.event_documents|DELETE FROM/);
});

test("postcheck covers effective grants, RLS, policies, functions, triggers, FKs and usages", () => {
  for (const marker of ["relrowsecurity", "relforcerowsecurity", "pg_policies", "has_table_privilege", "routine_privileges", "pg_trigger", "pg_constraint", "media_asset_usages"]) assert.match(postcheck, new RegExp(marker));
  assert.match(postcheck, /no_direct_client_write_policies/);
  assert.match(postcheck, /public_read_policy_present/);
});

test("rollback is explicitly marked as a security downgrade and changes no data", () => {
  assert.match(rollback, /SECURITY WARNING/);
  assert.match(rollback, /WITH CHECK\(true\)/);
  assert.match(rollback, /USING\(true\)/);
  assert.doesNotMatch(rollback, /INSERT INTO|UPDATE public\.event_documents|DELETE FROM|storage\./);
});
