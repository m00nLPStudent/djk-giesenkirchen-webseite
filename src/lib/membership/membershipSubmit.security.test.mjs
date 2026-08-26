import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("public action uses the server-only admin client and hides database errors", async () => {
  const action = await read("../../app/membership/actions.js");
  assert.match(action, /createSupabaseAdminClient/);
  assert.doesNotMatch(action, /createServerActionSupabaseClient/);
  assert.match(action, /result\.error\.code !== "VALIDATION_ERROR"/);
  assert.match(action, /konnte derzeit nicht gesendet werden/);
});

test("hardening proposal removes public insert and adds consent evidence", async () => {
  const sql = await read("../../../docs/sql/b15-21a-membership-submit-hardening-proposal.sql");
  for (const policy of ["insert_public", "select_admin", "update_admin", "delete_admin"]) {
    assert.match(sql, new RegExp(`DROP POLICY IF EXISTS membership_requests_${policy}`, "i"));
  }
  assert.match(sql, /ENABLE ROW LEVEL SECURITY/i);
  assert.match(sql, /NO FORCE ROW LEVEL SECURITY/i);
  assert.match(sql, /REVOKE ALL PRIVILEGES ON TABLE public\.membership_requests FROM PUBLIC, anon, authenticated/i);
  assert.match(sql, /REVOKE SELECT \(%s\), INSERT \(%s\), UPDATE \(%s\), REFERENCES \(%s\).*FROM PUBLIC, anon, authenticated/i);
  assert.match(sql, /GRANT ALL PRIVILEGES ON TABLE public\.membership_requests TO service_role/i);
  assert.match(sql, /privacy_consent boolean NOT NULL DEFAULT false/i);
  assert.match(sql, /privacy_consent_at timestamptz/i);
  assert.match(sql, /privacy_policy_version text/i);
});

test("membership admin reads and writes switch to service role only after authorization", async () => {
  const loader = await read("../../components/admin/membership/membershipRequests.loader.js");
  const actions = await read("../../app/admin/membership-requests/actions.js");
  const recordAccess = await read("../../components/admin/membership/membershipRequestRecordAccess.service.js");
  const dashboard = await read("../../components/admin/dashboard/dashboard.loader.js");
  assert.ok(loader.indexOf("await authenticate") < loader.indexOf("createSupabaseAdminClient()"));
  assert.ok(recordAccess.indexOf("await authenticate") < recordAccess.indexOf("createSupabaseAdminClient()"));
  assert.match(actions, /forwardMembershipRequest\(access\.request, target\.data, \{ client: access\.writeClient \}\)/);
  assert.match(dashboard, /async function loadMembershipCount\(allowedRequestTypes\)[\s\S]*createSupabaseAdminClient\(\)/);
  assert.doesNotMatch(dashboard, /loadMembershipCount\(auth\.supabaseServer\)/);
});

test("postcheck proves all browser privileges absent and preserves existing row fingerprints", async () => {
  const preflight = await read("../../../docs/sql/b15-21a-membership-submit-hardening-preflight-readonly.sql");
  const postcheck = await read("../../../docs/sql/b15-21a-membership-submit-hardening-postcheck-readonly.sql");
  for (const source of [preflight, postcheck]) {
    assert.match(source, /existing_data_fingerprint/);
    assert.match(source, /SELECT role_name, privilege/);
  }
  assert.match(preflight, /eligible_routines AS MATERIALIZED/);
  assert.match(preflight, /p\.prokind IN \('f', 'p'\)/);
});
