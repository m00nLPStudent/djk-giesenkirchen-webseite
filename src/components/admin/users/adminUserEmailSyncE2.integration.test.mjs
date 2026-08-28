import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const actions = read("../../../app/admin/users/actions.js");
const service = read("../../../lib/admin-auth/adminUserEmailSync.service.js");
const form = read("./forms/UserEditorForm.js");
const profileActions = read("../../../app/admin/profile/actions.js");
const deliveryRepository = read(
  "../notifications/delivery/notificationEmailDelivery.repository.js",
);

test("email request action is server-authorized and superadmin-only", () => {
  assert.match(actions, /assertAdminActionPermission\([\s\S]*users\.edit/);
  assert.match(actions, /role\?\.key === "superadmin"/);
  assert.match(actions, /requestAdminEmailChange\(\{[\s\S]*targetUserId: userId/);
  assert.match(actions, /Du bist für diese Änderung nicht berechtigt/);
});

test("service targets UUID and changes only Auth and profile email", () => {
  assert.match(service, /auth\.admin\.getUserById\(userId\)/);
  assert.match(service, /auth\.admin\.updateUserById\(userId, \{\s*email,/);
  assert.match(service, /from\("admin_profiles"\)[\s\S]*update\(\{ email \}\)[\s\S]*eq\("id", userId\)/);
  assert.doesNotMatch(
    service,
    /password|app_metadata|user_metadata|role_id|nickname|phone|avatar|admin_profile_id|full_name|is_active|last_login_at|coaches|board_members/,
  );
});

test("only superadmin edit UI enables a separate confirmed email request", () => {
  assert.match(form, /readOnly=\{mode === "edit" && !canChangeLoginEmail\}/);
  assert.match(form, /bisherige Login-E-Mail bleibt aktiv/);
  assert.match(form, /type="button"[\s\S]*onChangeEmail\(values\.email\)/);
  assert.match(form, /Bestätigung anfordern/);
});

test("own profile RPC remains narrow and cannot change official name or email", () => {
  assert.match(profileActions, /rpc\("update_own_dashboard_profile", \{ p_nickname: nickname, p_phone: phone \}\)/);
  assert.doesNotMatch(profileActions, /updateUserById|auth\.updateUser|p_email|full_name/);
});

test("raw provider details are not returned or logged", () => {
  assert.doesNotMatch(service, /error\.message|JSON\.stringify\(error|console\./);
  assert.doesNotMatch(actions, /console\.error\([\s\S]{0,200}(requestedEmail|email:)/);
});

test("notification delivery continues to resolve the mirrored profile email", () => {
  assert.match(
    deliveryRepository,
    /from\("admin_profiles"\)\.select\("id, email, is_active"\)/,
  );
});
