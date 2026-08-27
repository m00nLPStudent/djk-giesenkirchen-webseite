import "server-only";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import { buildNotificationEmailSettingsDto, hasActiveSuperadminRole, isKnownNotificationEmailSettingType, normalizeNotificationEmailSettingType, recommendedNotificationEmailSettings, resolveNotificationEmailDeliveryPolicy } from "./notificationEmailSettings.core.mjs";
import * as repository from "./notificationEmailSettings.repository";

const failure = (reason, message) => ({ ok: false, reason, message, data: null });

async function authorizeSuperadmin() {
  const auth = await assertAdminActionPermission({});
  if (!auth.ok) return failure(auth.reason, auth.message || "Keine aktive Admin-Sitzung.");
  if (!hasActiveSuperadminRole(auth.roles)) return failure("superadmin-required", "Diese Einstellung ist ausschließlich für Superadmins verfügbar.");
  const db = createSupabaseAdminClient();
  if (!db) return failure("service-unavailable", "Serverseitiger Einstellungszugriff ist nicht konfiguriert.");
  return { ok: true, db, actorId: auth.profile.id };
}

export async function loadNotificationEmailSettingsForDelivery(db, types = []) {
  const result = await repository.loadNotificationEmailSettings(db, types);
  return {
    error: result.error,
    policyFor: (type) => result.error
      ? { globalEnabled: false, typeEnabled: false, lookupFailed: true }
      : resolveNotificationEmailDeliveryPolicy(result.master, result.settings, type),
  };
}

export async function loadNotificationEmailSettingsForAdmin() {
  const auth = await authorizeSuperadmin();
  if (!auth.ok) return auth;
  const result = await repository.loadNotificationEmailSettings(auth.db);
  if (result.error) return failure("settings-load-failed", "E-Mail-Einstellungen konnten nicht geladen werden.");
  return { ok: true, data: buildNotificationEmailSettingsDto(result.master, result.settings) };
}

export async function setNotificationEmailMaster(enabled) {
  const auth = await authorizeSuperadmin();
  if (!auth.ok) return auth;
  const result = await repository.updateNotificationEmailMaster(auth.db, enabled === true, auth.actorId);
  return result.error || !result.data ? failure("master-update-failed", "Der globale Schalter konnte nicht gespeichert werden.") : { ok: true, data: { enabled: result.data.email_delivery_enabled === true }, message: "Globaler E-Mail-Status gespeichert." };
}

export async function setNotificationEmailType(type, enabled) {
  const normalized = normalizeNotificationEmailSettingType(type);
  if (!isKnownNotificationEmailSettingType(normalized)) return failure("unknown-type", "Unbekannter Notification-Typ.");
  const auth = await authorizeSuperadmin();
  if (!auth.ok) return auth;
  const result = await repository.updateNotificationEmailType(auth.db, normalized, enabled === true, auth.actorId);
  return result.error || !result.data ? failure("type-update-failed", "Die Type-Einstellung konnte nicht gespeichert werden.") : { ok: true, data: { type: normalized, enabled: result.data.email_enabled === true }, message: "Type-Einstellung gespeichert." };
}

export async function disableAllNotificationEmailTypes() {
  const auth = await authorizeSuperadmin();
  if (!auth.ok) return auth;
  const master = await repository.updateNotificationEmailMaster(auth.db, false, auth.actorId);
  if (master.error || !master.data) return failure("master-update-failed", "Der globale Schalter konnte nicht deaktiviert werden.");
  const rows = recommendedNotificationEmailSettings().map(({ notification_type }) => ({ notification_type, email_enabled: false, updated_by: auth.actorId }));
  const result = await repository.updateNotificationEmailTypes(auth.db, rows);
  return result.error ? failure("bulk-update-failed", "Die Typen konnten nicht vollständig deaktiviert werden.") : { ok: true, data: buildNotificationEmailSettingsDto(master.data, result.data), message: "Master und alle Typen wurden deaktiviert." };
}

export async function restoreRecommendedNotificationEmailTypes() {
  const auth = await authorizeSuperadmin();
  if (!auth.ok) return auth;
  const master = await repository.updateNotificationEmailMaster(auth.db, false, auth.actorId);
  if (master.error || !master.data) return failure("master-update-failed", "Der globale Schalter konnte nicht deaktiviert werden.");
  const rows = recommendedNotificationEmailSettings().map((row) => ({ ...row, updated_by: auth.actorId }));
  const result = await repository.updateNotificationEmailTypes(auth.db, rows);
  return result.error ? failure("restore-failed", "Die empfohlenen Einstellungen konnten nicht wiederhergestellt werden.") : { ok: true, data: buildNotificationEmailSettingsDto(master.data, result.data), message: "Empfohlene Einstellungen wiederhergestellt; der Master bleibt deaktiviert." };
}
