import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (name) => readFile(new URL(name, import.meta.url), "utf8");
const [service, repository, central, mailService, provider] = await Promise.all([
  read("./notificationEmailDelivery.service.js"), read("./notificationEmailDelivery.repository.js"),
  read("../notifications.service.js"), read("../../../../lib/mail/mail.service.js"), read("../../../../lib/mail/providers/resend.provider.js"),
]);

test("delivery modules are server-only and Resend stays behind the mail abstraction", () => {
  assert.match(service, /import "server-only"/);
  assert.match(repository, /import "server-only"/);
  assert.match(service, /sendMail/);
  assert.doesNotMatch(service, /resend|RESEND_API_KEY|fetch\(/i);
  assert.match(provider, /sendWithResend/);
  assert.match(mailService, /resolveMailProvider/);
});

test("all central persistence paths deliver only newly persisted raw rows", () => {
  assert.equal((central.match(/deliverPersistedNotificationEmailsBestEffort/g) || []).length, 4);
  assert.match(central, /if \(result\.data\) await deliverPersistedNotificationEmailsBestEffort\(\[result\.data\]/);
  assert.equal((central.match(/if \(result\.data\?\.length\) await deliverPersistedNotificationEmailsBestEffort\(result\.data/g) || []).length, 2);
  assert.equal((central.match(/await recordNotificationMonitoringEvent/g) || []).length, 5);
  for (const functionName of ["createNotification", "createNotifications", "createNotificationsOnce"]) {
    const functionStart = central.indexOf(`export async function ${functionName}(`);
    const functionEnd = central.indexOf("\nexport async function ", functionStart + 1);
    const body = central.slice(functionStart, functionEnd < 0 ? central.length : functionEnd);
    assert.ok(body.indexOf("await recordNotificationMonitoringEvent") < body.indexOf("await deliverPersistedNotificationEmailsBestEffort"));
  }
});

test("recipient comes only from active admin profile and ledger claims use compare-and-swap filters", () => {
  assert.match(repository, /from\("admin_profiles"\).*select\("id, email, is_active"\).*eq\("id", recipientUserId\).*eq\("is_active", true\)/s);
  assert.match(repository, /update\(\{[\s\S]*status: "sending"[\s\S]*\.eq\("status", delivery\.status\)[\s\S]*\.eq\("attempt_count", delivery\.attempt_count\)[\s\S]*\.is\("locked_at", null\)[\s\S]*\.lte\("next_attempt_at", nowIso\)/);
  assert.match(repository, /error\.code !== "23505"/);
  assert.doesNotMatch(repository, /forwarded_to_email|metadata|membership_requests/);
});
