import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [actions, shell, service, form, summary, roles, security, password, menu, mediaService, assignment, loginSession] = await Promise.all([
  read("../../../app/admin/profile/actions.js"),
  read("./components/AdminProfilePageShell.js"), read("./services/profile.service.js"), read("./forms/ProfileForm.js"),
  read("./components/ProfileSummaryCard.js"), read("./components/ProfileRolesCard.js"), read("./components/ProfileSecurityCard.js"), read("./forms/PasswordForm.js"),
  read("../topbar/ProfileMenu.js"), read("../media-library/media.service.js"), read("../media-library/mediaAssignment.core.mjs"), read("../../../lib/admin-auth/adminSession.service.js"),
]);

test("personal fields use only the narrow own-profile RPC", () => {
  assert.match(actions, /rpc\("update_own_dashboard_profile", \{ p_nickname: nickname, p_phone: phone \}\)/);
  assert.doesNotMatch(actions, /p_user|user_id|full_name|is_active/);
  assert.doesNotMatch(service, /updateOwnProfileFullName|\.from\("admin_profiles"\)\.update/);
  assert.match(form, /Offizieller Name[\s\S]*readOnly/);
  assert.match(form, /Login-E-Mail[\s\S]*readOnly/);
  assert.match(form, /maxLength=\{80\}/);
  assert.match(form, /maxLength=\{40\}/);
});

test("profile UI removes permissions and created-at duplication", () => {
  assert.doesNotMatch(shell, /ProfilePermissionsCard|createdAt|permissionCount/);
  assert.doesNotMatch(summary, /Erstellt am|Permissions|User-ID/);
  assert.match(roles, /Rollen &amp; Vereinsfunktionen/);
  assert.match(roles, /Trainer\/Betreuer/);
  assert.match(roles, /Vorstand/);
});

test("own avatar loader is actor-bound and never opens the global media library", () => {
  for (const filter of ["uploaded_by_user_id", "purpose", "media_kind", "visibility", "storage_bucket", "is_archived"]) assert.match(mediaService, new RegExp(`\\.eq\\(\"${filter}\"`));
  assert.match(actions, /loadOwnProfileMediaLibrary\(auth\.profile\.id, filters\)/);
  assert.doesNotMatch(actions, /loadMediaLibrary\(/);
  assert.doesNotMatch(actions, /p_entity_id:\s*media|profileId|userId\)/);
});

test("avatar upload and assignment enforce the central private profile contract", () => {
  assert.match(actions, /visibility: "admin", purpose: "profile"/);
  assert.match(actions, /\["image\/jpeg", "image\/png", "image\/webp"\]/);
  assert.match(actions, /synchronizeMediaAssignment\("admin_profile", auth\.profile\.id, mediaAssetId \|\| null, "avatar"\)/);
  assert.match(assignment, /fieldName === "avatar" && entityType === "admin_profile"/);
  assert.doesNotMatch(actions, /remove\(|archiveMediaAsset|deleteMedia/);
});

test("header prefers nickname and uses the private resolved avatar", () => {
  assert.match(menu, /context\?\.profile\?\.nickname \|\|/);
  assert.match(menu, /loadOwnProfileAvatarAction\(\)/);
  assert.match(menu, /userState\.avatarUrl/);
  assert.match(menu, /UserCircle/);
});

test("security keeps last login and compact password guidance", () => {
  assert.match(security, /Letzte Anmeldung/);
  assert.match(security, /ändere dein Passwort/);
  assert.match(password, /Passwortstärke/);
  assert.match(password, /strengthStyle/);
  assert.match(password, /checklist\.map/);
  assert.match(loginSession, /rpc\("touch_own_admin_profile_last_login"\)/);
  assert.doesNotMatch(loginSession, /update\(\{ last_login_at/);
});
