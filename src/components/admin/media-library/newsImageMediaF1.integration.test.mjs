import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [actions, editor, tab, panel, handlers, legacyService, initial, payload, edit, publicService, home, landing, overview, detail, proposal, postcheck, rollback] = await Promise.all([
  read("../../../app/admin/news/actions.js"), read("../news/forms/NewsEditorForm.js"), read("../news/tabs/NewsImagesTab.js"), read("../news/components/NewsMediaPanel.js"),
  read("../news/helpers/newsHandlers.js"), read("../news/services/news.service.js"), read("../news/helpers/newsInitialState.js"), read("../news/helpers/newsPayload.js"),
  read("../../../app/admin/news/edit/[id]/page.js"), read("../news/services/newsMedia.service.js"), read("../../../app/(website)/page.js"),
  read("../../../app/(website)/news/page.js"), read("../../../app/(website)/news/uebersicht/page.js"), read("../../../app/(website)/news/[slug]/page.js"),
  read("../../../../docs/sql/b15-19f1-news-image-media-reference-proposal.sql"), read("../../../../docs/sql/b15-19f1-news-image-media-reference-postcheck-readonly.sql"),
  read("../../../../docs/sql/b15-19f1-news-image-media-reference-rollback.sql"),
]);

test("create and edit use only the central news picker and upload path", () => {
  assert.match(panel, /AdminMediaPicker/);
  assert.match(panel, /usageContext="news"/);
  assert.match(editor, /loadNewsMediaPickerAction/);
  assert.match(editor, /uploadNewsMediaAction/);
  assert.doesNotMatch(handlers + legacyService, /uploadNewsImage|`news\/\$\{Date\.now/);
  for (const marker of ["image_media_asset_id", "remove_legacy_image"]) assert.match(initial + payload + editor, new RegExp(marker));
  assert.match(tab, /onMediaChange/);
});

test("server actions authorize visibility validate media and synchronize news usage", () => {
  assert.match(actions, /requiredPermission: newsId \? "news\.edit" : "news\.create"/);
  assert.match(actions, /canManageMedia[\s\S]*\["public", "admin"\]/);
  assert.match(actions, /resolveEntityImageMedia[\s\S]*synchronizeMediaAssignment\("news"/);
  assert.match(actions, /normalizePickerPurpose\(filters\.purpose, "news"\)/);
  assert.match(actions, /visibility: "public", purpose: "news"/);
  assert.doesNotMatch(actions, /"restricted"/);
  assert.match(edit, /loadMediaAssetForPicker\(news\.image_media_asset_id\)/);
});

test("public news surfaces batch public media and keep legacy fallback without signed URLs", () => {
  assert.match(publicService, /loadPublicMediaUrlMap/);
  assert.match(publicService, /resolveLoadedPublicMediaImage/);
  for (const source of [home, landing, overview]) assert.match(source, /resolvePublicNewsImages/);
  assert.match(detail, /resolvePublicNewsImages/);
  assert.doesNotMatch(home + landing + overview + detail + publicService, /loadMediaUrlMap|createSignedUrl/);
});

test("SQL adds only F1 state, hardens grants and cleans news usage on delete", () => {
  assert.match(proposal, /news ADD COLUMN IF NOT EXISTS image_media_asset_id uuid NULL/);
  assert.match(proposal, /REFERENCES public\.media_assets\(id\) ON DELETE SET NULL/);
  assert.match(proposal, /p_entity_type IN \('coach','player','board_member','club_contact','team','team_season','news'\)/);
  assert.match(proposal, /news_cleanup_media_usage AFTER DELETE/);
  assert.match(proposal, /REVOKE ALL[\s\S]*PUBLIC, anon, authenticated/);
  assert.doesNotMatch(proposal, /UPDATE public\.news SET image_url|INSERT INTO public\.media_assets|storage\./);
  assert.match(postcheck, /anon_must_be_false[\s\S]*authenticated_must_be_false[\s\S]*service_role_must_be_true/);
  assert.match(rollback, /Restores the exact B15\.19E3 assignment scope/);
  assert.doesNotMatch(rollback, /DROP TABLE|DELETE FROM public\.media_assets|storage\./);
  assert.match(actions, /deleteNewsAction[\s\S]*from\("news"\)\.delete\(\)/);
  assert.doesNotMatch(actions, /remove_entity/);
});
