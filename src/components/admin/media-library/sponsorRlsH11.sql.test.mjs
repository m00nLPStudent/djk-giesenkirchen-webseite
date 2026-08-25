import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const proposal = read("../../../../docs/sql/b15-19h1-1-sponsor-rls-table-grants-hardening-proposal.sql");
const postcheck = read("../../../../docs/sql/b15-19h1-1-sponsor-rls-table-grants-hardening-postcheck-readonly.sql");
const rollback = read("../../../../docs/sql/b15-19h1-1-sponsor-rls-table-grants-hardening-rollback.sql");
const sponsorActions = read("../../../app/admin/sponsors/actions.js");
const deleteButton = read("../sponsors/components/SponsorDeleteButton.js");

test("H1.1 removes all historical PUBLIC write policies without creating replacements", () => {
  for (const name of ["sponsors_insert_all", "sponsors_update_all", "sponsors_delete_all"]) assert.match(proposal, new RegExp(`DROP POLICY IF EXISTS ${name}`));
  assert.doesNotMatch(proposal, /CREATE POLICY/i);
  assert.doesNotMatch(proposal, /DROP POLICY IF EXISTS sponsors_select_all/i);
  assert.match(proposal, /ENABLE ROW LEVEL SECURITY/);
});

test("browser roles retain only SELECT while server and postgres privileges are untouched", () => {
  assert.match(proposal, /REVOKE INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER[\s\S]*FROM anon,authenticated/);
  assert.match(proposal, /GRANT SELECT ON TABLE public\.sponsors TO anon,authenticated/);
  assert.doesNotMatch(proposal, /REVOKE SELECT/i);
  assert.doesNotMatch(proposal, /(?:REVOKE|GRANT)[^;]*(?:service_role|postgres)/i);
});

test("postcheck covers RLS policies all seven privileges and the complete H1 contract", () => {
  for (const marker of ["relrowsecurity", "relforcerowsecurity", "pg_policies", "browser_write_policies_must_be_zero", "SELECT", "INSERT", "UPDATE", "DELETE", "TRUNCATE", "REFERENCES", "TRIGGER", "anon", "authenticated", "service_role"]) assert.ok(postcheck.includes(marker));
  for (const marker of ["image_media_asset_id", "sponsors_image_media_asset_id_fkey", "sponsors_image_media_asset_idx", "sponsor_cleanup_media_usage", "synchronize_media_assignment", "legacy_logos", "central_logos", "dual_references", "media_asset_usages"]) assert.ok(postcheck.includes(marker));
  assert.doesNotMatch(postcheck, /^\s*(?:INSERT INTO|UPDATE |DELETE FROM|ALTER TABLE|DROP POLICY|CREATE POLICY|GRANT |REVOKE )/im);
});

test("rollback is explicit security downgrade and restores no more than the observed state", () => {
  assert.match(rollback, /SECURITY-DOWNGRADE/);
  for (const name of ["sponsors_insert_all", "sponsors_update_all", "sponsors_delete_all"]) assert.match(rollback, new RegExp(`CREATE POLICY ${name}`));
  assert.match(rollback, /GRANT INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER[\s\S]*TO anon,authenticated/);
  assert.doesNotMatch(rollback, /service_role|postgres/i);
});

test("all sponsor mutations including delete stay behind server actions", () => {
  assert.match(sponsorActions, /"use server"/);
  assert.match(sponsorActions, /requiredPermission: "sponsors\.delete"/);
  assert.match(sponsorActions, /createSupabaseAdminClient/);
  assert.match(sponsorActions, /from\("sponsors"\)\.delete\(\)/);
  assert.match(deleteButton, /deleteSponsorAction/);
  assert.doesNotMatch(deleteButton, /removeSponsorRecord|\.rpc\(/);
});
