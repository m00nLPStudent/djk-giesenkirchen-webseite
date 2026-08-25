import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const actions = read("../../../app/admin/sponsors/actions.js");
const form = read("../sponsors/forms/AdminSponsorForm.js");
const upload = read("../sponsors/components/SponsorImageUpload.js");
const publicPage = read("../../../app/(website)/fussball/sponsoren/page.js");
const banner = read("../../website/sponsors/SponsorBanner.js");
const adminPage = read("../../../app/admin/sponsors/page.js");
const editPage = read("../../../app/admin/sponsors/edit/[id]/page.js");
const assignment = read("./mediaAssignment.core.mjs");
const proposal = read("../../../../docs/sql/b15-19h1-sponsor-logo-media-reference-proposal.sql");
const postcheck = read("../../../../docs/sql/b15-19h1-sponsor-logo-media-reference-postcheck-readonly.sql");
const rollback = read("../../../../docs/sql/b15-19h1-sponsor-logo-media-reference-rollback.sql");

test("sponsor logo writes use permission-checked central media actions", () => {
  assert.match(actions, /sponsors\.create/);
  assert.match(actions, /sponsors\.edit/);
  assert.match(actions, /createSupabaseAdminClient/);
  assert.match(actions, /uploadMediaAsset/);
  assert.match(actions, /purpose: "sponsor"/);
  assert.match(actions, /visibility: "public"/);
  assert.match(actions, /synchronizeMediaAssignment\("sponsor", saved\.data\.id, media\.data\?\.id \|\| null, "image"\)/);
  assert.doesNotMatch(actions, /storage\.from|uploadStorageFile|deleteMediaFile/);
});

test("picker supports direct upload, library selection, cross-purpose and removal", () => {
  assert.match(upload, /AdminMediaPicker/);
  assert.match(upload, /usageContext="sponsor"/);
  assert.match(upload, /object-contain/);
  assert.match(form, /loadSponsorMediaPickerAction/);
  assert.match(form, /uploadSponsorMediaAction/);
  assert.match(form, /image_media_asset_id: media\?\.id \|\| null/);
  assert.match(form, /remove_legacy_logo: media \? false : Boolean\(current\.image_url\)/);
  assert.match(actions, /normalizePickerPurpose\(filters\.purpose, "sponsor"\)/);
});

test("public and admin views resolve central media before legacy without private leakage", () => {
  assert.match(publicPage, /loadPublicMediaUrlMap/);
  assert.match(publicPage, /resolved_image_url: media\.data\.get\(sponsor\.image_media_asset_id\) \|\| sponsor\.image_url \|\| null/);
  assert.match(banner, /sponsor\.resolved_image_url \|\| sponsor\.image_url/);
  assert.match(adminPage, /loadMediaUrlMap/);
  assert.match(editPage, /resolveEntityImageMedia/);
  assert.match(actions, /canManageMedia[\s\S]*\["public", "admin"\][\s\S]*\["public"\]/);
});

test("schema extends only sponsor image usage and preserves all prior assignment targets", () => {
  assert.match(proposal, /ADD COLUMN IF NOT EXISTS image_media_asset_id uuid NULL/);
  assert.match(proposal, /REFERENCES public\.media_assets\(id\) ON DELETE SET NULL/);
  assert.match(proposal, /p_entity_type='sponsor' AND p_field_name='image'/);
  for (const target of ["coach", "player", "board_member", "club_contact", "team", "team_season", "news", "news_document", "event", "event_document", "sponsor"]) assert.ok(proposal.includes(`'${target}'`));
  assert.match(proposal, /TO service_role/);
  assert.match(proposal, /cleanup_sponsor_media_usage/);
  assert.match(assignment, /"sponsor"/);
});

test("postcheck is read-only inventory and rollback preserves assets and storage", () => {
  assert.doesNotMatch(postcheck, /\b(?:INSERT|UPDATE|DELETE|ALTER|DROP|CREATE|TRUNCATE)\b/i);
  for (const marker of ["legacy_logos", "central_logos", "dual_references", "distinct_legacy_urls", "possible_asset_id", "media_kind", "visibility", "is_archived", "media_asset_usages", "role_table_grants", "pg_policies"]) assert.ok(postcheck.includes(marker));
  assert.doesNotMatch(rollback, /DELETE FROM public\.media_assets|storage\.|storage\.objects/);
  assert.match(rollback, /entity_type='sponsor' AND field_name='image'/);
});
