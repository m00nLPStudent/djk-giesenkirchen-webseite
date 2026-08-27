import { escapeMailHtml } from "../../../../lib/mail/mail.core.mjs";

export const NOTIFICATION_EMAIL_CHANNEL = "email";
export const NOTIFICATION_EMAIL_SUBJECT = "Neue Benachrichtigung im Vereinsdashboard";

const EMAIL_COPY = Object.freeze({
  membership_created: "Eine neue relevante Mitgliedsanfrage ist eingegangen.",
  membership_assigned: "Dir wurde eine neue Mitgliedsanfrage zur Bearbeitung zugewiesen.",
  membership_forwarded: "Dir wurde eine Mitgliedsanfrage zur weiteren Bearbeitung weitergeleitet.",
  membership_completed: "Eine relevante Mitgliedsanfrage wurde abgeschlossen.",
  trainer_assigned: "Du wurdest einer Mannschaft als Trainer oder Betreuer zugewiesen.",
  trainer_removed: "Eine deiner Mannschaftszuordnungen wurde beendet.",
  trainer_changed: "Deine Funktion in einer Mannschaft wurde geändert.",
});

export const NOTIFICATION_EMAIL_TYPES = Object.freeze(Object.keys(EMAIL_COPY));

export function getNotificationEmailPolicy(type) {
  const normalized = String(type || "").trim();
  return EMAIL_COPY[normalized]
    ? { enabled: true, type: normalized, templateKey: normalized }
    : { enabled: false, type: normalized || "unknown", templateKey: null };
}

export function isPlausibleNotificationEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return email.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function buildTrustedDashboardUrl(value) {
  try {
    const url = new URL(String(value || ""));
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (url.username || url.password) return null;
    url.pathname = "/admin";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

export function renderNotificationEmail(type, { dashboardUrl = null } = {}) {
  const policy = getNotificationEmailPolicy(type);
  if (!policy.enabled) return { data: null, error: { code: "notification_email_type_denied" } };
  const eventText = EMAIL_COPY[policy.templateKey];
  const callToAction = dashboardUrl
    ? `Bitte melde dich im Vereinsdashboard an, um die Details einzusehen:\n${dashboardUrl}`
    : "Bitte melde dich im Vereinsdashboard an, um die Details einzusehen.";
  const text = ["Hallo,", "", eventText, "", callToAction, "", "Sportliche Grüße", "DJK/VfL Giesenkirchen"].join("\n");
  const link = dashboardUrl
    ? `<p><a href="${escapeMailHtml(dashboardUrl)}">Vereinsdashboard öffnen</a></p>`
    : "";
  const html = `<p>Hallo,</p><p>${escapeMailHtml(eventText)}</p><p>Bitte melde dich im Vereinsdashboard an, um die Details einzusehen.</p>${link}<p>Sportliche Grüße<br>DJK/VfL Giesenkirchen</p>`;
  return { data: { subject: NOTIFICATION_EMAIL_SUBJECT, text, html }, error: null };
}

export function notificationEmailIdempotencyKey(notificationId) {
  const id = String(notificationId || "").trim();
  return id ? `notification-email/${id}` : "";
}

export function sanitizeDeliveryProviderKey(value) {
  const key = String(value || "").trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "_").slice(0, 50);
  return key || null;
}

export function sanitizeDeliveryErrorClass(value) {
  const code = String(value || "").trim().toLowerCase();
  if (/^provider_http_[1-5][0-9]{2}$/.test(code)) return code;
  const allowed = new Set([
    "invalid_mail_message", "mail_delivery_failed", "mail_provider_failed",
    "mail_provider_not_configured", "mail_provider_unsupported", "provider_request_failed",
  ]);
  return allowed.has(code) ? code : "mail_delivery_failed";
}

export function nextNotificationEmailAttempt(attemptCount, now = new Date()) {
  const attempt = Math.max(1, Number(attemptCount) || 1);
  const delay = Math.min(15 * 60 * 1000 * (2 ** (attempt - 1)), 24 * 60 * 60 * 1000);
  return new Date(now.getTime() + delay).toISOString();
}

export function canClaimNotificationDelivery(delivery, now = new Date()) {
  if (!delivery || !["pending", "failed"].includes(delivery.status) || delivery.locked_at) return false;
  const due = new Date(delivery.next_attempt_at).getTime();
  return Number.isFinite(due) && due <= now.getTime() && Number(delivery.attempt_count) < 100;
}

const deliveryResult = (status, extra = {}) => ({ ok: status === "sent" || status === "skipped" || status === "already_sent", status, ...extra });

export async function executeNotificationEmailDelivery(notification, {
  db, mailer, store, now = () => new Date(), siteUrl = "", providerName = "",
} = {}) {
  if (!db || !notification?.id || !notification?.recipient_user_id || typeof mailer !== "function" || !store) return deliveryResult("failed", { code: "notification_email_input_invalid" });
  const policy = getNotificationEmailPolicy(notification.type);
  const createdAt = now();
  const ensured = await store.ensureNotificationDelivery(db, notification.id, policy.enabled ? "pending" : "skipped", createdAt.toISOString(), policy.enabled ? null : "notification_email_type_denied");
  if (ensured.error || !ensured.data) return deliveryResult("failed", { code: "notification_delivery_ensure_failed" });
  let delivery = ensured.data;
  if (!policy.enabled || delivery.status === "skipped") return deliveryResult("skipped", { code: policy.enabled ? delivery.last_error_class : "notification_email_type_denied" });
  if (delivery.status === "sent") return deliveryResult("already_sent");
  if (delivery.status === "sending" || !canClaimNotificationDelivery(delivery, createdAt)) return deliveryResult("not_claimed");

  const recipient = await store.loadNotificationEmailRecipient(db, notification.recipient_user_id);
  const email = !recipient.error && recipient.data?.is_active !== false ? isPlausibleNotificationEmail(recipient.data?.email) : null;
  if (!email) {
    const skipped = await store.markNotificationDeliverySkipped(db, delivery, recipient.error ? "notification_email_recipient_lookup_failed" : "notification_email_recipient_unavailable");
    return skipped.error || !skipped.data ? deliveryResult("failed", { code: "notification_delivery_skip_failed" }) : deliveryResult("skipped", { code: "notification_email_recipient_unavailable" });
  }

  const rendered = renderNotificationEmail(notification.type, { dashboardUrl: buildTrustedDashboardUrl(siteUrl) });
  if (rendered.error) return deliveryResult("skipped", { code: rendered.error.code });
  const claimed = await store.claimNotificationDelivery(db, delivery, createdAt.toISOString());
  if (claimed.error || !claimed.data) return deliveryResult(claimed.error ? "failed" : "not_claimed", { code: claimed.error ? "notification_delivery_claim_failed" : undefined });
  delivery = claimed.data;
  const providerKey = sanitizeDeliveryProviderKey(providerName);
  let sent;
  try {
    sent = await mailer({ to: email, ...rendered.data, idempotencyKey: notificationEmailIdempotencyKey(notification.id) });
  } catch {
    sent = { ok: false, status: "failed", error: { code: "mail_provider_failed" } };
  }
  if (sent?.ok && sent.status === "sent") {
    const marked = await store.markNotificationDeliverySent(db, delivery, { sentAt: now().toISOString(), providerKey, providerMessageId: sent.providerMessageId });
    return marked.error || !marked.data ? deliveryResult("failed", { code: "notification_delivery_sent_marker_failed", delivered: true }) : deliveryResult("sent");
  }
  const errorClass = sanitizeDeliveryErrorClass(sent?.error?.code);
  const marked = await store.markNotificationDeliveryFailed(db, delivery, {
    errorClass, providerKey, nextAttemptAt: nextNotificationEmailAttempt(delivery.attempt_count, now()),
  });
  return marked.error || !marked.data ? deliveryResult("failed", { code: "notification_delivery_failed_marker_failed" }) : deliveryResult("failed", { code: errorClass });
}
