import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const proposal = read("../../../../docs/sql/b15-19i1-1-club-history-rls-grants-hardening-proposal.sql");
const postcheck = read("../../../../docs/sql/b15-19i1-1-club-history-rls-grants-hardening-postcheck-readonly.sql");
const rollback = read("../../../../docs/sql/b15-19i1-1-club-history-rls-grants-hardening-rollback.sql");
const mediaPostcheck = read("../../../../docs/sql/b15-19i1-club-history-image-media-reference-postcheck-readonly.sql");
const actions = read("../../../app/admin/club-history/actions.js");
const form = read("./forms/ClubHistoryEditorForm.js");
const milestones = read("./components/ClubHistoryMilestonesManager.js");
const images = read("./components/ClubHistoryImagesManager.js");
const service = read("./services/clubHistory.service.js");
const publicPage = read("../../../app/(website)/fussball/vereinsgeschichte/page.js");

test("proposal removes browser write policies and all non-select browser grants", () => {
  assert.match(proposal, /cmd IN\('ALL','INSERT','UPDATE','DELETE'\)/);
  assert.match(proposal, /DROP POLICY IF EXISTS/);
  for (const table of ["club_history_pages", "club_history_images", "club_history_milestones"]) {
    assert.match(proposal, new RegExp(`REVOKE INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER ON TABLE public\\.${table} FROM PUBLIC,anon,authenticated`));
  }
  assert.match(proposal, /GRANT SELECT ON TABLE[\s\S]*TO anon,authenticated/);
  assert.doesNotMatch(proposal, /DROP POLICY[^;]*public_read/i);
  assert.doesNotMatch(proposal, /FORCE ROW LEVEL SECURITY/);
  assert.doesNotMatch(proposal, /service_role|postgres/i);
});

test("postcheck proves browser writes absent, reads retained and service role usable", () => {
  for (const token of ["relrowsecurity", "relforcerowsecurity", "browser_write_policy_must_be_empty", "public_read_policy_present", "service_role", "SELECT", "INSERT", "UPDATE", "DELETE", "TRUNCATE", "REFERENCES", "TRIGGER"]) assert.match(postcheck, new RegExp(token));
  assert.doesNotMatch(postcheck, /\b(?:INSERT INTO|UPDATE public|DELETE FROM|ALTER TABLE|DROP POLICY|CREATE POLICY|GRANT |REVOKE )/i);
});

test("rollback is an explicit data-free security downgrade", () => {
  assert.match(rollback, /SECURITY DOWNGRADE \/ NOT FOR NORMAL USE/);
  assert.match(rollback, /FOR ALL TO anon,authenticated USING\(true\) WITH CHECK\(true\)/);
  assert.match(rollback, /TRUNCATE,REFERENCES,TRIGGER/);
  assert.doesNotMatch(rollback, /\b(?:INSERT INTO|UPDATE public|DELETE FROM)\b/i);
});

test("page milestone and image mutations are authorized server actions", () => {
  assert.match(actions, /^"use server";/);
  assert.match(actions, /requiredPermission: "club_history\.edit"/);
  assert.match(actions, /createSupabaseAdminClient/);
  for (const name of ["saveClubHistoryPageAction", "createClubHistoryMilestoneAction", "updateClubHistoryMilestoneAction", "deleteClubHistoryMilestoneAction", "createClubHistoryImageAction", "updateClubHistoryImageAction", "deleteClubHistoryImageAction"]) assert.match(actions, new RegExp(`export async function ${name}`));
  assert.match(form, /saveClubHistoryPageAction/);
  for (const name of ["createClubHistoryMilestoneAction", "updateClubHistoryMilestoneAction", "deleteClubHistoryMilestoneAction"]) assert.match(milestones, new RegExp(name));
  assert.doesNotMatch(service, /supabase|service_role|SUPABASE_SERVICE/);
  assert.doesNotMatch(form + milestones + images, /@\/lib\/supabase|createSupabaseAdminClient/);
});

test("I1 media delete and public resolver contracts stay intact", () => {
  assert.match(actions, /Central assets and legacy storage objects remain intact/);
  assert.doesNotMatch(actions, /storage\.from\([^)]*\)\.remove|deleteMediaFile/);
  assert.equal((publicPage.match(/loadPublicMediaUrlMap\(/g) || []).length, 1);
  assert.match(publicPage, /mediaUrls\.data\.get\(image\.media_asset_id\) \|\| image\.image_url/);
});

test("I1 diagnostic function queries use robust expression ordering", () => {
  assert.match(mediaPostcheck, /ORDER BY p\.oid::regprocedure::text;/);
  assert.match(mediaPostcheck, /ORDER BY p\.oid::regprocedure::text,r\.rolname;/);
  assert.doesNotMatch(mediaPostcheck, /ORDER BY function_name/);
});

test("function definition diagnostics materialize eligible routines before deparsing", () => {
  assert.equal((mediaPostcheck.match(/eligible_proc AS MATERIALIZED/g) || []).length, 2);
  assert.equal((mediaPostcheck.match(/defined_proc AS MATERIALIZED/g) || []).length, 2);
  assert.equal((mediaPostcheck.match(/p\.prokind IN\('f','p'\)/g) || []).length, 2);
  assert.equal((mediaPostcheck.match(/pg_get_functiondef\(p\.oid\)/g) || []).length, 2);
  assert.equal((mediaPostcheck.match(/SELECT p\.\*,pg_get_functiondef\(p\.oid\) definition FROM eligible_proc p/g) || []).length, 2);
});
