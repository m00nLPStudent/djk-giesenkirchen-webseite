import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const proposal = read("../../../../docs/sql/b15-19h1-2-remove-entity-rpc-hardening-proposal.sql");
const postcheck = read("../../../../docs/sql/b15-19h1-2-remove-entity-rpc-hardening-postcheck-readonly.sql");
const rollback = read("../../../../docs/sql/b15-19h1-2-remove-entity-rpc-hardening-rollback.sql");
const removeActions = read("../delete/removeActions.js");
const newsActions = read("../../../app/admin/news/actions.js");
const newsButton = read("../ui/DeleteNewsButton.js");
const boardActions = read("../../../app/admin/department/board/actions.js");

test("proposal removes inherited and direct browser EXECUTE while preserving service role", () => {
  assert.match(proposal, /REVOKE ALL ON FUNCTION public\.remove_entity\(text,uuid\) FROM PUBLIC,anon,authenticated/);
  assert.match(proposal, /GRANT EXECUTE ON FUNCTION public\.remove_entity\(text,uuid\) TO service_role/);
  assert.doesNotMatch(proposal, /REVOKE[^;]*(?:service_role|postgres)/i);
  assert.match(proposal, /ALTER FUNCTION public\.remove_entity\(text,uuid\) SET search_path=public,pg_temp/);
});

test("no application call site still invokes the legacy RPC", () => {
  for (const source of [removeActions,newsActions,newsButton,boardActions]) assert.doesNotMatch(source, /remove_entity|\.rpc\(/);
  assert.match(newsActions, /requiredPermission: "news\.delete"[\s\S]*createSupabaseAdminClient/);
  assert.match(boardActions, /requiredPermission: "board\.delete"[\s\S]*createSupabaseAdminClient/);
});

test("postcheck inventories function security ACLs dependencies and H1.1 invariants read-only", () => {
  for (const marker of ["regprocedure", "pg_get_userbyid", "prosecdef", "provolatile", "proconfig", "pg_get_functiondef", "aclexplode", "PUBLIC", "anon", "authenticated", "service_role", "postgres", "pg_depend"]) assert.ok(postcheck.includes(marker));
  for (const marker of ["relrowsecurity", "relforcerowsecurity", "pg_policies", "sponsor_browser_write_policies_must_be_zero", "TRUNCATE", "REFERENCES", "TRIGGER", "image_media_asset_id", "sponsors_image_media_asset_id_fkey", "sponsors_image_media_asset_idx", "sponsor_cleanup_media_usage"]) assert.ok(postcheck.includes(marker));
  assert.doesNotMatch(postcheck, /^\s*(?:INSERT INTO|UPDATE |DELETE FROM|ALTER |DROP |CREATE |GRANT |REVOKE )/im);
});

test("proposal cannot weaken sponsor SELECT or remove H1 structures", () => {
  assert.doesNotMatch(proposal, /public\.sponsors|sponsors_select_all|image_media_asset_id|media_assets|media_asset_usages/i);
  assert.doesNotMatch(proposal, /FORCE ROW LEVEL SECURITY/i);
});

test("rollback exactly restores the confirmed exposure and marks the downgrade", () => {
  assert.match(rollback, /SECURITY-DOWNGRADE/);
  assert.match(rollback, /RESET search_path/);
  assert.match(rollback, /GRANT EXECUTE ON FUNCTION public\.remove_entity\(text,uuid\) TO PUBLIC,anon,authenticated/);
  assert.doesNotMatch(rollback, /REVOKE[^;]*(?:service_role|postgres)/i);
});
