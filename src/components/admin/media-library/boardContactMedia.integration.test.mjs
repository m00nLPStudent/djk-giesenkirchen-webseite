import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [boardForm, boardActions, contactForm, contactActions, mediaRepository, sql] = await Promise.all([
  read("../board/forms/AdminBoardMemberForm.js"),
  read("../../../app/admin/department/board/actions.js"),
  read("../settings/components/ContactForm.js"),
  read("../../../app/admin/settings/contacts/actions.js"),
  read("./media.repository.js"),
  read("../../../../docs/sql/b15-19d-board-contact-media-reference-proposal.sql"),
]);

test("board and contact use only the central picker and media upload service", () => {
  for (const form of [boardForm, contactForm]) assert.match(form, /AdminMediaPicker/);
  for (const action of [boardActions, contactActions]) {
    assert.match(action, /uploadMediaAsset/);
    assert.doesNotMatch(action, /uploadMediaFile|storage\.from\([^)]*\)\.upload/);
  }
});

test("both server paths recheck permission, visibility, purpose and active images", () => {
  assert.match(boardActions, /assertAdminActionPermission/);
  assert.match(contactActions, /requiredPermission: "settings\.edit"/);
  for (const action of [boardActions, contactActions]) {
    assert.match(action, /canManageMedia/);
    assert.match(action, /kind: "image"/);
    assert.match(action, /archived: "active"/);
    assert.doesNotMatch(action, /"restricted"/);
  }
});

test("reference replacement and removal are delegated to the atomic usage RPC", () => {
  assert.match(sql, /ELSIF p_entity_type = 'board_member' THEN[\s\S]*UPDATE public\.board_members/);
  assert.match(sql, /ELSE[\s\S]*UPDATE public\.club_contacts/);
  assert.match(sql, /DELETE FROM public\.media_asset_usages/);
  assert.match(sql, /INSERT INTO public\.media_asset_usages/);
  assert.match(mediaRepository, /rpc\("synchronize_media_assignment"/);
});

test("legacy image URLs are read by forms but not written by the new saves", () => {
  assert.match(boardForm, /legacyUrl=/);
  assert.match(contactForm, /legacyUrl=/);
  assert.doesNotMatch(boardActions, /image_url:/);
  assert.match(contactActions, /remove_legacy_image === true/);
  assert.doesNotMatch(contactActions, /image_url:\s*media/);
});
