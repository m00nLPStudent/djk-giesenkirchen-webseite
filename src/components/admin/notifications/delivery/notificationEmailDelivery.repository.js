import "server-only";

const DELIVERY_FIELDS = "id, notification_id, channel, status, attempt_count, provider_key, provider_message_id, last_error_class, locked_at, next_attempt_at, sent_at, created_at, updated_at";

export function loadNotificationEmailRecipient(db, recipientUserId) {
  return db.from("admin_profiles").select("id, email, is_active").eq("id", recipientUserId).eq("is_active", true).maybeSingle();
}

export async function ensureNotificationDelivery(db, notificationId, initialStatus, nowIso, initialReason = null) {
  const inserted = await db.from("notification_deliveries").insert({
    notification_id: notificationId,
    channel: "email",
    status: initialStatus,
    last_error_class: initialReason,
    next_attempt_at: nowIso,
  }).select(DELIVERY_FIELDS).maybeSingle();
  if (!inserted.error) return inserted;
  if (inserted.error.code !== "23505") return inserted;
  return db.from("notification_deliveries").select(DELIVERY_FIELDS).eq("notification_id", notificationId).eq("channel", "email").maybeSingle();
}

export function claimNotificationDelivery(db, delivery, nowIso) {
  return db.from("notification_deliveries").update({
    status: "sending",
    locked_at: nowIso,
    attempt_count: Number(delivery.attempt_count) + 1,
    last_error_class: null,
  })
    .eq("id", delivery.id)
    .eq("status", delivery.status)
    .eq("attempt_count", delivery.attempt_count)
    .is("locked_at", null)
    .lte("next_attempt_at", nowIso)
    .select(DELIVERY_FIELDS)
    .maybeSingle();
}

export function markNotificationDeliverySkipped(db, delivery, reason) {
  return db.from("notification_deliveries").update({ status: "skipped", locked_at: null, last_error_class: reason })
    .eq("id", delivery.id).eq("status", delivery.status).eq("attempt_count", delivery.attempt_count).is("locked_at", null)
    .select(DELIVERY_FIELDS).maybeSingle();
}

export function markNotificationDeliverySent(db, delivery, { sentAt, providerKey, providerMessageId }) {
  return db.from("notification_deliveries").update({
    status: "sent", sent_at: sentAt, locked_at: null, provider_key: providerKey,
    provider_message_id: providerMessageId ? String(providerMessageId).slice(0, 300) : null,
    last_error_class: null,
  }).eq("id", delivery.id).eq("status", "sending").eq("attempt_count", delivery.attempt_count).eq("locked_at", delivery.locked_at)
    .select(DELIVERY_FIELDS).maybeSingle();
}

export function markNotificationDeliveryFailed(db, delivery, { errorClass, nextAttemptAt, providerKey }) {
  return db.from("notification_deliveries").update({
    status: "failed", locked_at: null, last_error_class: errorClass,
    next_attempt_at: nextAttemptAt, provider_key: providerKey, provider_message_id: null,
  }).eq("id", delivery.id).eq("status", "sending").eq("attempt_count", delivery.attempt_count).eq("locked_at", delivery.locked_at)
    .select(DELIVERY_FIELDS).maybeSingle();
}
