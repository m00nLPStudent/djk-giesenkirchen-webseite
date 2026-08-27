import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [callback, setPage, setForm, forgot, profileService, redirects, invite, proxy, authConfig, permissionConfig] = await Promise.all([
  read("../../../app/admin/auth/callback/route.js"), read("../../../app/admin/set-password/page.js"), read("./SetPasswordForm.js"),
  read("../../../app/admin/forgot-password/page.js"), read("../profile/services/profile.service.js"), read("../../../lib/admin-auth/adminAuthRedirects.js"),
  read("../../../lib/admin-auth/adminUserInvite.service.js"), read("../../../proxy.js"), read("../../../lib/admin-auth/adminAuthConfig.js"), read("../../../lib/admin-auth/adminPermissionConfig.js"),
]);

test("password reset starts use the stable SSR callback URL", () => {
  assert.match(redirects, /\/admin\/auth\/callback\?next=%2Fadmin%2Fset-password/);
  assert.match(forgot, /buildAdminPasswordCallbackUrl/);
  assert.match(profileService, /buildAdminPasswordCallbackUrl/);
  assert.match(forgot, /resetPasswordForEmail\(email, \{ redirectTo \}\)/);
  assert.match(profileService, /resetPasswordForEmail\(email, \{[\s\S]*redirectTo/);
});

test("callback exchanges a valid code server-side and writes returned auth cookies", () => {
  assert.match(callback, /createServerClient/);
  assert.match(callback, /request\.cookies\.getAll\(\)/);
  assert.match(callback, /exchangeCodeForSession\(code\)/);
  assert.match(callback, /pendingCookies\.forEach[\s\S]*response\.cookies\.set/);
  assert.match(callback, /httpOnly: true/);
});

test("callback without or with invalid code fails with a sanitized redirect", () => {
  assert.match(callback, /if \(!code\) return NextResponse\.redirect/);
  assert.match(callback, /error=invalid-or-expired/);
  assert.doesNotMatch(callback, /error\.message|error_description|access_token|refresh_token/);
});

test("password form is gated by server-validated recovery session", () => {
  assert.match(setPage, /admin-password-recovery/);
  assert.match(setPage, /supabase\.auth\.getUser\(\)/);
  assert.match(setPage, /initialRecoverySession=\{hasRecoverySession\}/);
  assert.match(setForm, /initialRecoverySession/);
  assert.match(setForm, /disabled=\{!hasRecoverySession/);
  assert.match(setForm, /Der Link zum Zurücksetzen des Passworts ist ungültig oder abgelaufen/);
  assert.doesNotMatch(setForm, /PKCE code verifier|exchangeCodeForSession\(code\)/);
});

test("password update remains authenticated and raw provider errors stay hidden", () => {
  assert.match(setForm, /auth\.updateUser\(\{[\s\S]*password/);
  assert.match(setForm, /auth\.signOut\(\)/);
  assert.match(setForm, /router\.push\("\/admin\/login"\)/);
  assert.doesNotMatch(setForm, /updateError\.message/);
});

test("existing invite bootstrap stays separate from PKCE recovery", () => {
  assert.match(invite, /buildAdminRedirectUrl\("\/admin\/set-password"\)/);
  assert.match(setForm, /params\.get\("type"\) === "invite"/);
  assert.match(setForm, /history\.replaceState/);
  assert.match(setForm, /auth\.setSession/);
});

test("the callback is public only within the existing admin auth boundary", () => {
  for (const source of [proxy, authConfig, permissionConfig]) assert.match(source, /\/admin\/auth\/callback/);
});
