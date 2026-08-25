import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [picker, dialog, hook, teamActions, mediaActions, service, proposal, postcheck, rollback] = await Promise.all([
  read("./AdminMediaPicker.js"), read("./AdminMediaPickerDialog.js"),
  read("../teams/forms/useTeamMedia.js"), read("../../../app/admin/teams/actions.js"),
  read("../../../app/admin/media/actions.js"), read("./media.service.js"),
  read("../../../../docs/sql/b15-19e1-1-team-media-purpose-constraint-proposal.sql"),
  read("../../../../docs/sql/b15-19e1-1-team-media-purpose-constraint-postcheck-readonly.sql"),
  read("../../../../docs/sql/b15-19e1-1-team-media-purpose-constraint-rollback.sql"),
]);

test("team direct upload returns the uploaded item into preview and form media id", () => {
  assert.match(picker, /const response = await uploadAction\(data\)/);
  assert.match(picker, /if \(response\.ok\) onChange\(response\.item\)/);
  assert.match(hook, /setSelectedMedia\(media\)/);
  assert.match(hook, /team_image_media_asset_id: media\?\.id \|\| null/);
  assert.match(teamActions, /return resolved\.error \? [\s\S]*: \{ ok: true, item: resolved\.data \}/);
  assert.match(teamActions, /visibility: "public", purpose: "team"/);
});

test("picker upload controls do not submit the surrounding team form", () => {
  assert.doesNotMatch(picker + dialog, /<form/);
  assert.match(dialog, /<button type="button" onClick=\{search\}/);
  assert.match(picker, /<button type="button" onClick=\{\(\)=>onChange\(null\)\}/);
  assert.match(picker, /<input type="file"[\s\S]*onChange=\{upload\}/);
});

test("shared upload reports exact stage, cleans storage after insert failure and contains exceptions", () => {
  assert.match(service, /stage: "validation"/);
  assert.match(service, /stage: "storage_upload"/);
  assert.match(service, /stage: "media_assets_insert"/);
  assert.match(service, /rollbackAttempted: true/);
  assert.match(service, /stage: "unexpected"/);
  assert.match(teamActions, /\[team-media-upload\]/);
  assert.match(mediaActions, /\[media-upload\]/);
  assert.match(mediaActions, /stage: "server_action"/);
});

test("E1.1 SQL changes only the media purpose check and postcheck stays read-only", () => {
  assert.match(proposal, /ALTER TABLE public\.media_assets[\s\S]*media_assets_purpose_check/);
  assert.match(proposal, /'board', 'team', 'news'/);
  assert.doesNotMatch(proposal, /INSERT|UPDATE|DELETE FROM|storage\.|team_seasons|contact_image_url/);
  assert.match(postcheck, /pg_get_constraintdef/);
  assert.match(postcheck, /WHERE purpose = 'team'/);
  assert.doesNotMatch(postcheck, /\b(INSERT|UPDATE|DELETE|ALTER|DROP|CREATE)\b/);
  assert.match(rollback, /Rollback refused: team-purpose media assets exist/);
  assert.doesNotMatch(rollback, /DELETE FROM public\.media_assets|storage\.|team_seasons|contact_image_url/);
});
