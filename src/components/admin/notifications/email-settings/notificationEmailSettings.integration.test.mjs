import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [service, repository, actions, page, ui, proposal] = await Promise.all([
  read("./notificationEmailSettings.service.js"), read("./notificationEmailSettings.repository.js"),
  read("../../../../app/admin/system/notification-email-settings/actions.js"), read("../../../../app/admin/system/notification-email-settings/page.js"),
  read("./NotificationEmailSettingsModule.js"), read("../../../../../docs/sql/b15-21d8-notification-email-settings-proposal.sql"),
]);

test("page and every mutation delegate to a server-side superadmin authorization boundary", () => {
  assert.match(service, /assertAdminActionPermission/);
  assert.match(service, /hasActiveSuperadminRole\(auth\.roles\)/);
  assert.ok(service.indexOf("assertAdminActionPermission") < service.indexOf("createSupabaseAdminClient()"));
  for (const name of ["setNotificationEmailMaster", "setNotificationEmailType", "disableAllNotificationEmailTypes", "restoreRecommendedNotificationEmailTypes"]) assert.match(actions, new RegExp(name));
  assert.match(page, /loadNotificationEmailSettingsForAdmin/);
  assert.doesNotMatch(ui, /createSupabaseAdminClient|SUPABASE_SERVICE|\.from\("notification_email_/);
});

test("repository is server-only and batches master and type reads", () => {
  assert.match(repository, /import "server-only"/);
  assert.match(repository, /Promise\.all/);
  assert.match(repository, /\.in\("notification_type", normalized\)/);
  assert.match(repository, /updated_by: actorId/);
});

test("bulk actions turn master off before overwriting types and restore never enables it", () => {
  for (const name of ["disableAllNotificationEmailTypes", "restoreRecommendedNotificationEmailTypes"]) {
    const start = service.indexOf(`export async function ${name}`);
    const end = service.indexOf("\nexport async function ", start + 1);
    const body = service.slice(start, end < 0 ? service.length : end);
    assert.ok(body.indexOf("updateNotificationEmailMaster(auth.db, false") < body.indexOf("updateNotificationEmailTypes"));
    assert.doesNotMatch(body, /updateNotificationEmailMaster\(auth\.db, true/);
  }
});

test("database remains browser-denied and service-role-only", () => {
  for (const table of ["notification_email_settings", "notification_email_global_settings"]) {
    assert.match(proposal, new RegExp(`REVOKE ALL PRIVILEGES ON TABLE public\\.${table} FROM PUBLIC, anon, authenticated`));
    assert.match(proposal, new RegExp(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public\\.${table} TO service_role`));
  }
  assert.doesNotMatch(proposal, /CREATE POLICY/i);
});

test("responsive UI exposes master types confirmations and DB-derived state", () => {
  for (const marker of ["E-Mail-Benachrichtigungen global", "Alle Typen deaktivieren", "Empfohlene Einstellungen", "window.confirm", "role=\"switch\"", "sm:flex-row", "settings.items"]) assert.ok(ui.includes(marker));
});

test("notification types use compact responsive list rows", () => {
  for (const marker of ["AdminModuleList", "AdminListHeader", "AdminListRow", "Ereignis", "Beschreibung", "Type-Key", "E-Mail", "divide-y divide-white/10", "px-3 py-3", "py-2.5", "lg:block", "lg:hidden"]) assert.ok(ui.includes(marker));
  assert.doesNotMatch(ui, /min-h-24/);
});
