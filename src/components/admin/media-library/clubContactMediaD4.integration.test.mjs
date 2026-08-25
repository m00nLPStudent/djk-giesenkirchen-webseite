import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [settingsPage, contactForm, contactList, editor, editPage, mediaService, publicPage, contactActions] = await Promise.all([
  read("../../../app/admin/settings/page.js"),
  read("../settings/components/ContactForm.js"),
  read("../settings/components/ContactList.js"),
  read("../settings/SettingsContactEditorView.js"),
  read("../../../app/admin/settings/contacts/edit/[id]/page.js"),
  read("./media.service.js"),
  read("../../../app/(website)/kontakt/page.js"),
  read("../../../app/admin/settings/contacts/actions.js"),
]);

test("contact detail header and picker preview share media, legacy, placeholder resolution", () => {
  assert.match(editPage, /loadMediaAssetForPicker\(result\.record\.image_media_asset_id\)/);
  assert.match(editPage, /initialMedia=\{media\.data \|\| null\}/);
  assert.match(contactForm, /resolveLoadedMediaImage\(form, mediaUrls, placeholderUrl\)/);
  assert.match(contactForm, /imageUrl: resolvedImageUrl/);
  assert.match(contactForm, /AdminImagePreview src=\{resolvedImageUrl\}/);
  assert.doesNotMatch(contactForm, /imageUrl: form\.image_url/);
  assert.match(editor, /setSelectedMedia\(media\)/);
  assert.match(editor, /image_url: media \? current\.image_url : ""/);
});

test("contact overview resolves all IDs once and supplies one image to desktop and mobile", () => {
  assert.match(settingsPage, /select\("\*"\)/);
  assert.match(settingsPage, /contacts\.map\(\(contact\) => contact\.image_media_asset_id\)/);
  assert.match(settingsPage, /loadMediaUrlMap/);
  assert.match(settingsPage, /resolved_image_url: resolveLoadedMediaImage/);
  assert.match(contactList, /imageUrl: contact\.resolved_image_url/);
  assert.equal((contactList.match(/\{avatar\(contact\)\}/g) || []).length, 2);
  assert.doesNotMatch(contactList, /supabase|loadMedia|imageUrl: contact\.image_url/);
});

test("admin batch visibility stays role-scoped and private URLs stay server-generated", () => {
  assert.match(settingsPage, /canManageMedia\(permissionResult\.roles\) \? \["public", "admin"\] : \["public"\]/);
  assert.match(mediaService, /\.in\("id", uniqueIds\)\.in\("visibility", allowedVisibilities\)/);
  assert.match(mediaService, /\.eq\("media_kind", "image"\)\.eq\("is_archived", false\)/);
  assert.match(mediaService, /createSignedUrls/);
  assert.doesNotMatch(settingsPage + contactForm, /createSignedUrl|storage\.from/);
});

test("public contact resolution remains public-only and mutation revalidates affected routes", () => {
  assert.match(publicPage, /loadPublicMediaUrlMap/);
  assert.match(publicPage, /resolveLoadedPublicMediaImage/);
  assert.doesNotMatch(publicPage, /loadMediaUrlMap/);
  assert.match(contactActions, /revalidatePath\("\/admin\/settings"\)/);
  assert.match(contactActions, /revalidatePath\("\/kontakt"\)/);
});
