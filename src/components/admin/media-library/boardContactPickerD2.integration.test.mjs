import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [dialog, picker, purposes, boardActions, contactActions, boardPage, mediaService, proposal] = await Promise.all([
  read("./AdminMediaPickerDialog.js"), read("./AdminMediaPicker.js"), read("./mediaPurpose.config.mjs"),
  read("../../../app/admin/department/board/actions.js"), read("../../../app/admin/settings/contacts/actions.js"),
  read("../../../app/admin/department/page.js"), read("./media.service.js"),
  read("../../../../docs/sql/b15-19d2-media-cross-purpose-assignment-proposal.sql"),
]);

test("board and contact defaults map centrally while the purpose filter stays changeable", () => {
  assert.match(purposes, /context === "board_member" \? "board"/);
  assert.match(purposes, /context === "club_contact" \? "cms"/);
  assert.match(picker, /getDefaultPurposeForUsageContext/);
  assert.match(dialog, /<option value="all">Alle Verwendungen<\/option>/);
  assert.match(dialog, /purposeOptions\.map/);
  assert.match(dialog, /changePurpose\(event\.target\.value\)/);
  assert.doesNotMatch(dialog, /select[^>]+disabled/);
});

test("picker filters are server-normalized but uploads keep their fachlicher purpose", () => {
  assert.match(boardActions, /normalizePickerPurpose\(filters\.purpose, "board"\)/);
  assert.match(contactActions, /normalizePickerPurpose\(filters\.purpose, "cms"\)/);
  assert.match(boardActions, /uploadMediaAsset[\s\S]*purpose: "board"/);
  assert.match(contactActions, /uploadMediaAsset[\s\S]*purpose: "cms"/);
  for (const source of [boardActions, contactActions]) {
    assert.match(source, /kind: "image"/);
    assert.match(source, /archived: "active"/);
    assert.doesNotMatch(source, /"restricted"/);
  }
});

test("cross-purpose assignment preserves the asset and adds only entity usage", () => {
  assert.doesNotMatch(proposal, /v_asset\.purpose|UPDATE public\.media_assets/);
  assert.match(proposal, /v_asset\.media_kind <> 'image'/);
  assert.match(proposal, /v_asset\.is_archived/);
  assert.match(proposal, /DELETE FROM public\.media_asset_usages/);
  assert.match(proposal, /INSERT INTO public\.media_asset_usages/);
  assert.match(proposal, /REVOKE ALL[\s\S]*authenticated/);
});

test("board overview resolves all media ids in one visibility-scoped batch", () => {
  assert.match(boardPage, /image_media_asset_id/);
  assert.match(boardPage, /loadMediaUrlMap\(\(members \|\| \[\]\)\.map/);
  assert.match(boardPage, /mediaUrls\.data\.get\(member\.image_media_asset_id\) \|\| member\.image_url/);
  assert.match(mediaService, /\.in\("id", uniqueIds\)\.in\("visibility", allowedVisibilities\)/);
  assert.match(mediaService, /createSignedUrls/);
});
