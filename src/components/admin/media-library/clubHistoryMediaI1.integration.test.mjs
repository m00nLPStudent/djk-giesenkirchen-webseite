import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const actions = read("../../../app/admin/club-history/actions.js");
const manager = read("../club-history/components/ClubHistoryImagesManager.js");
const publicPage = read("../../website/club-history/ClubHistoryPublicPage.js");
const adminPage = read("../../../app/admin/club-history/page.js");
const assignment = read("./mediaAssignment.core.mjs");
const proposal = read("../../../../docs/sql/b15-19i1-club-history-image-media-reference-proposal.sql");
const postcheck = read("../../../../docs/sql/b15-19i1-club-history-image-media-reference-postcheck-readonly.sql");
const rollback = read("../../../../docs/sql/b15-19i1-club-history-image-media-reference-rollback.sql");

test("chronicle images use server-authorized central upload and existing picker", () => {
  assert.match(manager, /AdminMediaPicker/);
  assert.match(actions, /requiredPermission: "club_history\.edit"/);
  assert.match(actions, /uploadMediaAsset/);
  assert.match(actions, /visibility: "public"/);
  assert.match(actions, /purpose: "club_history"/);
  assert.doesNotMatch(manager, /@\/lib\/supabase|uploadMediaFile|storage\.from/);
});

test("each gallery row owns one usage and cross-purpose stays selectable", () => {
  assert.match(assignment, /"club_history"/);
  assert.match(actions, /synchronizeMediaAssignment\("club_history", saved\.data\.id, media\.data\.id, "image"\)/);
  assert.match(actions, /normalizePickerPurpose\(filters\.purpose, "club_history"\)/);
  assert.doesNotMatch(actions, /resolveEntityImageMedia\(mediaAssetId, \{ purpose:/);
});

test("public resolution is batched, public-only and falls back to legacy", () => {
  assert.equal((publicPage.match(/loadPublicMediaUrlMap\(/g) || []).length, 1);
  assert.match(publicPage, /mediaUrls\.data\.get\(image\.media_asset_id\) \|\| image\.image_url/);
  assert.match(publicPage, /src=\{image\.resolvedImageUrl\}/);
  assert.match(adminPage, /loadMediaAssetsForPicker/);
});

test("delete keeps assets and legacy storage while cleanup removes only usage", () => {
  assert.match(actions, /Central assets and legacy storage objects remain intact/);
  assert.doesNotMatch(actions, /storage\.from\([^)]*\)\.remove|deleteMediaFile/);
  assert.match(proposal, /cleanup_club_history_image_media_usage/);
  assert.match(proposal, /DELETE FROM public\.media_asset_usages WHERE entity_type='club_history'/);
});

test("schema proposal is nullable, guarded and has no migration", () => {
  assert.match(proposal, /ADD COLUMN IF NOT EXISTS media_asset_id uuid NULL/);
  assert.match(proposal, /ON DELETE SET NULL/);
  assert.match(proposal, /ALTER COLUMN image_url DROP NOT NULL/);
  assert.doesNotMatch(proposal, /UPDATE public\.club_history_images\s+SET\s+(?:image_url|image_path)|storage\.objects/i);
  assert.match(rollback, /rollback refused/i);
});

test("security inventory is read-only and covers grants and definer bypasses", () => {
  for (const token of ["relrowsecurity", "relforcerowsecurity", "pg_policies", "anon", "authenticated", "service_role", "TRUNCATE", "REFERENCES", "TRIGGER", "prosecdef", "effective_execute"]) assert.match(postcheck, new RegExp(token));
  assert.doesNotMatch(postcheck, /\b(?:INSERT|UPDATE|DELETE|ALTER|DROP|CREATE|GRANT|REVOKE|TRUNCATE)\s+(?:INTO|FROM|TABLE|FUNCTION|ON)\b/i);
});
