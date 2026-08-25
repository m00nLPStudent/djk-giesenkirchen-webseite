import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [actions, form, core, service, repository, proposal] = await Promise.all([read("../../../app/admin/players/actions.js"), read("../players/forms/AdminPlayersForm.js"), read("../players/forms/playerForm.core.mjs"), read("./media.service.js"), read("./media.repository.js"), read("../../../../docs/sql/b15-19c-player-media-reference-proposal.sql")]);

test("player picker is server-authorized and fixed to active player images", () => {
  assert.match(actions, /players\.edit|players\.create/);
  assert.match(actions, /canEditPlayerOnServer/);
  assert.match(actions, /normalizePickerPurpose\(filters\.purpose, "player"\)/);
  assert.match(actions, /kind: "image"[\s\S]*purpose[\s\S]*archived: "active"/);
  assert.match(actions, /\["public", "admin"\] : \["public"\]/);
  assert.doesNotMatch(actions, /"restricted"/);
});

test("player create and edit use the central picker and upload service", () => {
  assert.match(form, /AdminMediaPicker/);
  assert.match(form, /usageContext="player"/);
  assert.match(form, /loadPlayerMediaPickerAction/);
  assert.match(form, /uploadPlayerMediaAction/);
  assert.doesNotMatch(form, /useImageUpload|uploadPlayerImage|deletePlayerImage/);
  assert.match(core, /image_media_asset_id/);
});

test("coach and player share one atomic reference and usage RPC", () => {
  assert.match(service, /synchronizeMediaAssignment/);
  assert.match(repository, /db\.rpc\("synchronize_media_assignment"/);
  assert.match(proposal, /UPDATE public\.players SET image_media_asset_id/);
  assert.match(proposal, /DELETE FROM public\.media_asset_usages/);
  assert.match(proposal, /INSERT INTO public\.media_asset_usages/);
  assert.match(proposal, /REVOKE ALL[\s\S]*authenticated/);
});
