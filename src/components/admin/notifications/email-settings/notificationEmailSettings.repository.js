import "server-only";

export async function loadNotificationEmailSettings(db, types = []) {
  const normalized = [...new Set(types.filter(Boolean))];
  const [master, settings] = await Promise.all([
    db.from("notification_email_global_settings").select("setting_key, email_delivery_enabled, updated_at").eq("setting_key", "global").maybeSingle(),
    normalized.length
      ? db.from("notification_email_settings").select("notification_type, email_enabled, updated_at").in("notification_type", normalized)
      : db.from("notification_email_settings").select("notification_type, email_enabled, updated_at").order("notification_type"),
  ]);
  return { master: master.data, settings: settings.data || [], error: master.error || settings.error || null };
}

export function updateNotificationEmailMaster(db, enabled, actorId) {
  return db.from("notification_email_global_settings")
    .update({ email_delivery_enabled: enabled, updated_by: actorId })
    .eq("setting_key", "global").select("setting_key, email_delivery_enabled, updated_at").maybeSingle();
}

export function updateNotificationEmailType(db, type, enabled, actorId) {
  return db.from("notification_email_settings")
    .update({ email_enabled: enabled, updated_by: actorId })
    .eq("notification_type", type).select("notification_type, email_enabled, updated_at").maybeSingle();
}

export function updateNotificationEmailTypes(db, rows) {
  return db.from("notification_email_settings").upsert(rows, { onConflict: "notification_type" })
    .select("notification_type, email_enabled, updated_at");
}
