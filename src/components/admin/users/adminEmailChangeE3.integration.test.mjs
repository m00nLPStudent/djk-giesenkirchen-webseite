import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const actions = read("../../../app/admin/users/actions.js");
const service = read("../../../lib/admin-auth/adminEmailChange.service.js");
const finalize = read("../../../lib/admin-auth/adminUserEmailSync.service.js");
const page = read("../../../app/auth/confirm-email-change/page.js");
const confirmationAction = read("../../../app/auth/confirm-email-change/actions.js");
const form = read("../../auth/EmailChangeConfirmationForm.js");
const profile = read("../profile/forms/ProfileForm.js");

test("request action rechecks session, users.edit and active superadmin before stable UUID service call", () => {
  assert.match(actions, /assertSuperadminActionPermission\(\{[\s\S]*requiredPermission: "users\.edit"/);
  assert.match(actions, /role\?\.key === "superadmin" && role\?\.is_active !== false/);
  assert.match(actions, /requestAdminEmailChange\(\{[\s\S]*actorUserId: actorContext\.userId[\s\S]*targetUserId: userId/);
  assert.doesNotMatch(actions, /changeAdminUserEmail\(/);
});

test("pending table is accessed only by server-only service and UI requests rather than finalizes", () => {
  assert.match(service, /import "server-only"/);
  assert.match(service, /createSupabaseAdminClient/);
  assert.match(service, /from\("admin_email_change_requests"\)/);
  assert.match(finalize, /export async function finalizeAdminUserEmailChange/);
  assert.doesNotMatch(actions, /admin_email_change_requests|finalizeAdminUserEmailChange/);
});

test("GET page only inspects while explicit POST action performs confirmation", () => {
  assert.match(page, /await inspectAdminEmailChange\(token\)/);
  assert.doesNotMatch(page, /confirmAdminEmailChange|\.update\(|\.insert\(|\.delete\(/);
  assert.match(form, /<form action=\{action\}/);
  assert.match(form, /type="submit"/);
  assert.match(confirmationAction, /confirmAdminEmailChange\(token\)/);
  assert.doesNotMatch(confirmationAction, /redirect\(|GET|searchParams/);
});

test("public confirmation surfaces remain enumeration-neutral and normal profile remains read-only", () => {
  assert.doesNotMatch(page, /old_email|new_email|requested_by|user_id|request\.id/);
  assert.match(page, /ungültig oder nicht mehr verfügbar/);
  assert.match(profile, /readOnly/);
  assert.doesNotMatch(profile, /requestAdminEmailChange|confirmAdminEmailChange/);
});

test("service uses existing mail abstraction, base URL helper and sanitized logging", () => {
  assert.match(service, /buildAdminRedirectUrl\("\/auth\/confirm-email-change"\)/);
  assert.match(service, /sendMail/);
  assert.match(service, /createMailIdempotencyKey/);
  assert.match(service, /profile\.is_active === false/);
  assert.match(service, /role\.key === "superadmin" && role\.is_active !== false/);
  assert.match(service, /permission\.key === "users\.edit"/);
  assert.doesNotMatch(service, /RESEND_API_KEY|SUPABASE_SERVICE_ROLE_KEY|console\.(log|info)\([^)]*(email|token)/i);
});

test("compensation is atomically claimed and verified before the only reverse Auth update", () => {
  assert.match(service, /async claimCompensation\(/);
  assert.match(service, /\.update\(payload\)[\s\S]*\.eq\("id", requestId\)[\s\S]*\.eq\("user_id", userId\)/);
  assert.match(service, /\.eq\("old_email", oldEmail\)\.eq\("new_email", newEmail\)/);
  assert.match(service, /\.eq\("confirmed_at", workflowTimestamp\)/);
  assert.match(service, /originStatus === "completed"[\s\S]*\.eq\("completed_at", workflowTimestamp\)/);
  assert.match(service, /verified\?\.status === "compensating"/);
  assert.match(service, /sameTimestamp\(verified\?\.compensation_started_at, compensationStartedAt\)/);
  assert.match(service, /async reverseAuthEmail\([\s\S]*this\.loadAuthUser\(userId\)[\s\S]*updateUserById\(userId, \{ email: originalEmail \}\)[\s\S]*this\.loadAuthUser\(userId\)/);
  assert.match(service, /async finishCompensation\([\s\S]*status: "failed", completed_at: null, locked_at: null/);
  assert.doesNotMatch(finalize, /originalEmail[\s\S]*updateAuthEmail|compensateAuth/);
});
