const SELECT_FIELDS = "id, recipient_user_id, actor_user_id, type, title, message, target_url, entity_type, entity_id, metadata, is_read, read_at, created_at, updated_at";

export function loadNotificationsFromRepository(db, recipientUserId, { limit = 100, unreadOnly = false } = {}) {
  let query = db.from("notifications").select(SELECT_FIELDS).eq("recipient_user_id", recipientUserId).order("created_at", { ascending: false }).limit(limit);
  if (unreadOnly) query = query.eq("is_read", false);
  return query;
}

export function loadUnreadCountFromRepository(db, recipientUserId) {
  return db.from("notifications").select("id", { count: "exact", head: true }).eq("recipient_user_id", recipientUserId).eq("is_read", false);
}

export function insertNotificationInRepository(db, payload) {
  return db.from("notifications").insert(payload).select(SELECT_FIELDS).single();
}

export function insertNotificationsInRepository(db, payloads) {
  return db.from("notifications").insert(payloads).select(SELECT_FIELDS);
}

export function isNotificationUniqueViolation(error) {
  return error?.code === "23505" && String(error?.message || "").includes("notifications_recipient_type_idempotency_unique");
}

export async function insertNotificationsIdempotentlyInRepository(db, payloads) {
  const settled = await Promise.all(payloads.map((payload) => insertNotificationInRepository(db, payload)));
  const data = [], errors = [];
  let duplicateCount = 0;
  for (const result of settled) {
    if (!result.error && result.data) data.push(result.data);
    else if (isNotificationUniqueViolation(result.error)) duplicateCount += 1;
    else if (result.error) errors.push(result.error);
  }
  return { data, duplicateCount, error: errors[0] || null, failedCount: errors.length };
}

export function markNotificationReadInRepository(db, recipientUserId, id, nowIso) {
  return db.from("notifications").update({ is_read: true, read_at: nowIso }).eq("id", id).eq("recipient_user_id", recipientUserId).select(SELECT_FIELDS).maybeSingle();
}

export function markAllNotificationsReadInRepository(db, recipientUserId, nowIso) {
  return db.from("notifications").update({ is_read: true, read_at: nowIso }).eq("recipient_user_id", recipientUserId).eq("is_read", false);
}

export function deleteNotificationFromRepository(db, recipientUserId, id) {
  return db.from("notifications").delete().eq("id", id).eq("recipient_user_id", recipientUserId);
}

export function deleteAllReadFromRepository(db, recipientUserId) {
  return db.from("notifications").delete().eq("recipient_user_id", recipientUserId).eq("is_read", true);
}

export function loadPotentialDuplicateNotifications(db, recipientUserIds = [], types = [], sinceIso = null) {
  if (!recipientUserIds.length || !types.length) return Promise.resolve({ data: [], error: null });
  let query = db.from("notifications").select("recipient_user_id, type, metadata").in("recipient_user_id", recipientUserIds).in("type", types);
  if (sinceIso) query = query.gte("created_at", sinceIso);
  return query;
}
