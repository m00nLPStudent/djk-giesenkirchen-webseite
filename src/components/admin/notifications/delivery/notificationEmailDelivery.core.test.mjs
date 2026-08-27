import test from "node:test";
import assert from "node:assert/strict";
import {
  NOTIFICATION_EMAIL_TYPES, buildTrustedDashboardUrl, executeNotificationEmailDelivery,
  getNotificationEmailPolicy, isPlausibleNotificationEmail, notificationEmailIdempotencyKey,
  renderNotificationEmail, sanitizeDeliveryErrorClass,
} from "./notificationEmailDelivery.core.mjs";

const notification = { id: "11111111-1111-4111-8111-111111111111", recipient_user_id: "user-1", type: "membership_assigned", title: "Mia Muster", message: "private", metadata: { requestId: "secret" } };
const fixedNow = () => new Date("2026-08-27T10:00:00.000Z");
const enabledPolicy = { globalEnabled: true, typeEnabled: true };

function createStore({ email = "trainer@example.org", active = true } = {}) {
  const rows = new Map();
  let sequence = 0;
  return {
    rows,
    async ensureNotificationDelivery(_db, notificationId, initialStatus, nowIso, initialReason = null) {
      await Promise.resolve();
      if (!rows.has(notificationId)) rows.set(notificationId, { id: `delivery-${++sequence}`, notification_id: notificationId, channel: "email", status: initialStatus, attempt_count: 0, locked_at: null, next_attempt_at: nowIso, sent_at: null, last_error_class: initialReason });
      return { data: { ...rows.get(notificationId) }, error: null };
    },
    async loadNotificationEmailRecipient() { return { data: email === null ? null : { id: "user-1", email, is_active: active }, error: null }; },
    async claimNotificationDelivery(_db, delivery, nowIso) {
      await Promise.resolve();
      const current = rows.get(delivery.notification_id);
      if (!current || current.status !== delivery.status || current.attempt_count !== delivery.attempt_count || current.locked_at) return { data: null, error: null };
      const claimed = { ...current, status: "sending", locked_at: nowIso, attempt_count: current.attempt_count + 1 };
      rows.set(delivery.notification_id, claimed);
      return { data: { ...claimed }, error: null };
    },
    async markNotificationDeliverySkipped(_db, delivery, reason) {
      const skipped = { ...rows.get(delivery.notification_id), status: "skipped", locked_at: null, last_error_class: reason };
      rows.set(delivery.notification_id, skipped); return { data: { ...skipped }, error: null };
    },
    async markNotificationDeliverySent(_db, delivery, values) {
      const sent = { ...rows.get(delivery.notification_id), status: "sent", locked_at: null, sent_at: values.sentAt, provider_key: values.providerKey, provider_message_id: values.providerMessageId || null };
      rows.set(delivery.notification_id, sent); return { data: { ...sent }, error: null };
    },
    async markNotificationDeliveryFailed(_db, delivery, values) {
      const failed = { ...rows.get(delivery.notification_id), status: "failed", locked_at: null, last_error_class: values.errorClass, next_attempt_at: values.nextAttemptAt };
      rows.set(delivery.notification_id, failed); return { data: { ...failed }, error: null };
    },
  };
}

test("registry contains all 16 globally recommended renderers and remains default-deny", () => {
  assert.equal(NOTIFICATION_EMAIL_TYPES.length, 16);
  for (const type of ["membership_created", "player_assigned", "team_changed", "membership_processing", "membership_payment_overdue", "membership_payment_partial_open", "member_activated", "member_deactivated", "member_archived", "event_updated"]) assert.ok(NOTIFICATION_EMAIL_TYPES.includes(type));
  assert.equal(getNotificationEmailPolicy("membership_created").enabled, true);
  assert.equal(getNotificationEmailPolicy("event_cancelled").enabled, false);
  assert.equal(getNotificationEmailPolicy("future_type").enabled, false);
});

test("renderer is generic and excludes dashboard content, metadata and ids", () => {
  const rendered = renderNotificationEmail(notification.type, { dashboardUrl: "https://verein.example/admin" });
  const combined = `${rendered.data.subject}\n${rendered.data.text}\n${rendered.data.html}`;
  for (const forbidden of [notification.title, notification.message, notification.id, "requestId", "secret"]) assert.doesNotMatch(combined, new RegExp(forbidden));
  assert.match(combined, /Vereinsdashboard/);
  assert.match(rendered.data.html, /&lt;|<p>/);
});

test("all 16 configured active types have datensparse renderers", () => {
  const forbidden = [notification.title, notification.message, notification.id, "requestId", "secret", "100,00", "Geburtsdatum"];
  for (const type of NOTIFICATION_EMAIL_TYPES) {
    const rendered = renderNotificationEmail(type, { dashboardUrl: "https://verein.example/admin" });
    assert.equal(rendered.error, null);
    const combined = `${rendered.data.subject}\n${rendered.data.text}\n${rendered.data.html}`;
    for (const value of forbidden) assert.doesNotMatch(combined, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("recipient validation and dashboard URL accept only plausible trusted values", () => {
  assert.equal(isPlausibleNotificationEmail(" Trainer@Example.org "), "trainer@example.org");
  for (const value of ["", "missing-at.example", "a@b", "a b@example.org"]) assert.equal(isPlausibleNotificationEmail(value), null);
  assert.equal(buildTrustedDashboardUrl("https://verein.example/path?q=1#x"), "https://verein.example/admin");
  assert.equal(buildTrustedDashboardUrl("javascript:alert(1)"), null);
  assert.equal(buildTrustedDashboardUrl("https://user:secret@verein.example"), null);
});

test("parallel delivery claims once and sends exactly once", async () => {
  const store = createStore();
  const messages = [];
  const mailer = async (message) => { messages.push(message); return { ok: true, status: "sent", providerMessageId: "provider-1" }; };
  const options = { db: {}, store, mailer, now: fixedNow, siteUrl: "https://verein.example", providerName: "resend", deliveryPolicy: enabledPolicy };
  const outcomes = await Promise.all([executeNotificationEmailDelivery(notification, options), executeNotificationEmailDelivery(notification, options)]);
  assert.equal(messages.length, 1);
  assert.equal(outcomes.filter((item) => item.status === "sent").length, 1);
  assert.equal(store.rows.get(notification.id).attempt_count, 1);
  assert.equal(store.rows.get(notification.id).status, "sent");
  assert.equal(messages[0].idempotencyKey, notificationEmailIdempotencyKey(notification.id));
});

test("sent is terminal while provider failure is sanitized and retry-ready", async () => {
  const store = createStore();
  let sends = 0;
  const failing = async () => { sends += 1; return { ok: false, status: "failed", error: { code: "provider_http_503", message: "private payload" } }; };
  const options = { db: {}, store, mailer: failing, now: fixedNow, providerName: "resend", deliveryPolicy: enabledPolicy };
  const failed = await executeNotificationEmailDelivery(notification, options);
  assert.equal(failed.code, "provider_http_503");
  assert.equal(store.rows.get(notification.id).status, "failed");
  assert.equal(store.rows.get(notification.id).locked_at, null);
  assert.equal(store.rows.get(notification.id).next_attempt_at, "2026-08-27T10:15:00.000Z");
  store.rows.get(notification.id).next_attempt_at = "2026-08-27T09:59:00.000Z";
  const successful = await executeNotificationEmailDelivery(notification, { ...options, mailer: async () => { sends += 1; return { ok: true, status: "sent" }; } });
  assert.equal(successful.status, "sent");
  assert.equal(store.rows.get(notification.id).attempt_count, 2);
  await executeNotificationEmailDelivery(notification, options);
  assert.equal(sends, 2);
});

test("denied types and unavailable recipients become skipped without mail", async () => {
  let sends = 0;
  const mailer = async () => { sends += 1; return { ok: true, status: "sent" }; };
  const deniedStore = createStore();
  const denied = await executeNotificationEmailDelivery({ ...notification, type: "player_updated" }, { db: {}, store: deniedStore, mailer, now: fixedNow, deliveryPolicy: enabledPolicy });
  assert.equal(denied.status, "skipped");
  assert.equal(deniedStore.rows.get(notification.id).status, "skipped");
  assert.equal(deniedStore.rows.get(notification.id).last_error_class, "notification_email_renderer_unavailable");
  for (const recipientState of [{ email: null }, { email: "invalid" }, { email: "trainer@example.org", active: false }]) {
    const store = createStore(recipientState);
    const outcome = await executeNotificationEmailDelivery(notification, { db: {}, store, mailer, now: fixedNow, deliveryPolicy: enabledPolicy });
    assert.equal(outcome.status, "skipped");
  }
  assert.equal(sends, 0);
});

test("global and type settings fail closed with distinct skipped reasons", async () => {
  for (const [policy, reason] of [
    [{ globalEnabled: false, typeEnabled: true }, "notification_email_global_disabled"],
    [{ globalEnabled: true, typeEnabled: false }, "notification_email_type_disabled"],
    [{ globalEnabled: false, typeEnabled: false, lookupFailed: true }, "notification_email_settings_unavailable"],
  ]) {
    let sends = 0;
    const store = createStore();
    const outcome = await executeNotificationEmailDelivery(notification, { db: {}, store, now: fixedNow, deliveryPolicy: policy, mailer: async () => { sends += 1; return { ok: true, status: "sent" }; } });
    assert.equal(outcome.status, "skipped");
    assert.equal(store.rows.get(notification.id).last_error_class, reason);
    assert.equal(sends, 0);
  }
});

test("unknown provider errors collapse to a safe class", () => {
  assert.equal(sanitizeDeliveryErrorClass("contains-recipient@example.org"), "mail_delivery_failed");
});

test("throwing mailer is converted to failed and releases the lock", async () => {
  const store = createStore();
  const outcome = await executeNotificationEmailDelivery(notification, { db: {}, store, now: fixedNow, deliveryPolicy: enabledPolicy, mailer: async () => { throw new Error("private"); } });
  assert.equal(outcome.status, "failed");
  assert.equal(outcome.code, "mail_provider_failed");
  assert.equal(store.rows.get(notification.id).status, "failed");
  assert.equal(store.rows.get(notification.id).locked_at, null);
});
