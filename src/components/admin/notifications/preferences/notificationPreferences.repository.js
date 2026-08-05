import "server-only";

export function loadNotificationPreferences(db, userId) {
  return db.from("notification_preferences").select("notification_type, in_app_enabled").eq("user_id", userId);
}

export async function loadNotificationPreferenceMap(db, userIds, types) {
  const users = [...new Set(userIds.filter(Boolean))];
  const notificationTypes = [...new Set(types.filter(Boolean))];
  if (!users.length || !notificationTypes.length) return { data: new Map(), error: null };
  const result = await db.from("notification_preferences").select("user_id, notification_type, in_app_enabled").in("user_id", users).in("notification_type", notificationTypes);
  return { ...result, data: new Map((result.data || []).map((row) => [`${row.user_id}:${row.notification_type}`, row.in_app_enabled])) };
}

export function upsertNotificationPreference(db, userId, type, enabled) {
  return db.from("notification_preferences").upsert({ user_id: userId, notification_type: type, in_app_enabled: enabled }, { onConflict: "user_id,notification_type" });
}
export function resetNotificationPreference(db, userId, type) { return db.from("notification_preferences").delete().eq("user_id", userId).eq("notification_type", type); }
export function resetAllOptionalNotificationPreferences(db, userId, types) { return db.from("notification_preferences").delete().eq("user_id", userId).in("notification_type", types); }
