import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [actions, editor, initialState, assignmentCore, d2Sql, d3Sql, mediaService] = await Promise.all([
  read("../../../app/admin/settings/contacts/actions.js"),
  read("../settings/SettingsContactEditorView.js"),
  read("../settings/helpers/settingsInitialState.js"),
  read("./mediaAssignment.core.mjs"),
  read("../../../../docs/sql/b15-19d2-media-cross-purpose-assignment-proposal.sql"),
  read("../../../../docs/sql/b15-19d3-club-contact-media-usage-entity-proposal.sql"),
  read("./media.service.js"),
]);

test("contact assignment sends the exact shared RPC payload after the contact exists", () => {
  assert.match(actions, /query\.select\("\*"\)\.maybeSingle\(\)[\s\S]*synchronizeMediaAssignment\("club_contact", saved\.data\.id, media\.data\?\.id \|\| null\)/);
  assert.match(assignmentCore, /p_entity_type: entityType/);
  assert.match(assignmentCore, /p_entity_id: entityId/);
  assert.match(assignmentCore, /p_media_asset_id: mediaAssetId \|\| null/);
  assert.match(assignmentCore, /p_field_name: fieldName/);
});

test("D3 adds only club_contact to the existing usage entity allowlist", () => {
  assert.match(d3Sql, /ALTER TABLE public\.media_asset_usages/);
  assert.match(d3Sql, /'board_member', 'club_contact'/);
  assert.doesNotMatch(d3Sql, /INSERT INTO public\.media_asset_usages|UPDATE public\.club_contacts|DELETE FROM public\.media_assets/);
  assert.match(d2Sql, /p_entity_type NOT IN \('coach', 'player', 'board_member', 'club_contact'\)/);
  assert.doesNotMatch(d2Sql, /v_asset\.purpose/);
});

test("explicit contact removal clears media id and only the contact legacy fallback", () => {
  assert.match(initialState, /remove_legacy_image: false/);
  assert.match(editor, /image_media_asset_id: media\?\.id \|\| null/);
  assert.match(editor, /image_url: media \? current\.image_url : ""/);
  assert.match(editor, /remove_legacy_image: !media/);
  assert.match(actions, /form\?\.remove_legacy_image === true\) payload\.image_url = null/);
  assert.match(actions, /image_url: form\?\.remove_legacy_image === true \? null/);
});

test("cross-purpose validation remains visibility-scoped and does not rewrite assets", () => {
  assert.match(actions, /allowedVisibilities/);
  assert.match(actions, /resolveEntityImageMedia/);
  assert.doesNotMatch(actions, /"restricted"|from\("media_assets"\)\.update/);
  assert.match(mediaService, /allowedVisibilities\.includes\(result\.data\.visibility\)/);
});

test("sync failures are logged without payloads and never reported as success", () => {
  assert.match(actions, /console\.error\("\[club-contact-media-sync\]"/);
  assert.match(actions, /Die Kontaktbild-Verwendung konnte nicht gespeichert werden/);
  assert.ok(actions.indexOf("if (usage.error)") < actions.indexOf('revalidatePath("/admin/settings")'));
});
