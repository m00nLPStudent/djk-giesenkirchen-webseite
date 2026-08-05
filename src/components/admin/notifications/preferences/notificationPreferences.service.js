import "server-only";
import * as repository from "./notificationPreferences.repository";
import { filterInputsWithPreferenceMap, getOptionalNotificationTypes, isNotificationEnabled, isNotificationTypeConfigurable, isNotificationTypeMandatory, notificationPreferenceDefinitions } from "./notificationPreferencePolicy.mjs";

export async function loadOwnNotificationPreferences(db, userId) {
  const result = await repository.loadNotificationPreferences(db, userId);
  const map = new Map((result.data || []).map((row) => [row.notification_type, row.in_app_enabled]));
  return { ...result, data: notificationPreferenceDefinitions.map((item) => ({ ...item, enabled: isNotificationEnabled(item.type, map.get(item.type)) })) };
}
export function updateOwnNotificationPreference(db, userId, type, enabled) {
  if (!isNotificationTypeConfigurable(type)) return Promise.resolve({ data: null, error: new Error("Diese Benachrichtigung ist erforderlich oder nicht konfigurierbar.") });
  return enabled ? repository.resetNotificationPreference(db, userId, type) : repository.upsertNotificationPreference(db, userId, type, false);
}
export async function setAllOptionalNotificationPreferences(db, userId, enabled) {
  const types = getOptionalNotificationTypes();
  if (enabled) return repository.resetAllOptionalNotificationPreferences(db, userId, types);
  return db.from("notification_preferences").upsert(types.map((type) => ({ user_id: userId, notification_type: type, in_app_enabled: false })), { onConflict: "user_id,notification_type" });
}
export function resetOwnNotificationPreferences(db, userId) { return repository.resetAllOptionalNotificationPreferences(db, userId, getOptionalNotificationTypes()); }

export async function filterRecipientsByNotificationPreferences(db, inputs = []) {
  if (!inputs.length) return { allowed: [], skipped: [], mandatoryType: false, lookupError: null, inputCount: 0, outputCount: 0 };
  const types = [...new Set(inputs.map((item) => item.type))];
  if (types.every(isNotificationTypeMandatory)) return { allowed: inputs, skipped: [], mandatoryType: true, lookupError: null, inputCount: inputs.length, outputCount: inputs.length };
  const lookup = await repository.loadNotificationPreferenceMap(db, inputs.map((item) => item.recipientUserId), types);
  if (lookup.error) return { allowed: inputs, skipped: [], mandatoryType: types.every(isNotificationTypeMandatory), lookupError: lookup.error, inputCount: inputs.length, outputCount: inputs.length };
  const { allowed, skipped } = filterInputsWithPreferenceMap(inputs, lookup.data);
  return { allowed, skipped, mandatoryType: types.every(isNotificationTypeMandatory), lookupError: null, inputCount: inputs.length, outputCount: allowed.length };
}
