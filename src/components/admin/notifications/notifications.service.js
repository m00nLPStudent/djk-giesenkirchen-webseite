import "server-only";
import { createNotificationDto, createNotificationDtos } from "./notification.dto";
import { normalizeNotificationTarget, normalizeNotificationType } from "./notifications.core.mjs";
import * as repository from "./notifications.repository";
import { recordNotificationMonitoringEvent } from "./monitoring/notificationMonitoring.logger";
import { filterRecipientsByNotificationPreferences } from "./preferences/notificationPreferences.service";

const preferenceAudit = (result) => ({ inputCount: result.inputCount, skippedCount: result.skipped.length, outputCount: result.outputCount, mandatoryType: result.mandatoryType });

function createPayload(input) {
  return {
    recipient_user_id: input.recipientUserId,
    actor_user_id: input.actorUserId || null,
    type: normalizeNotificationType(input.type),
    title: String(input.title || "Benachrichtigung").trim(),
    message: String(input.message || "").trim(),
    target_url: normalizeNotificationTarget(input.targetUrl),
    entity_type: input.entityType || null,
    entity_id: input.entityId || null,
    metadata: input.metadata && typeof input.metadata === "object" ? input.metadata : {},
  };
}

export async function createNotification(input, { db }) {
  const started = Date.now();
  const preferences = await filterRecipientsByNotificationPreferences(db, [input]);
  const result = preferences.allowed.length ? await repository.insertNotificationInRepository(db, createPayload(input)) : { data: null, error: null };
  await recordNotificationMonitoringEvent({ type: input.type, status: result.error ? "failed" : preferences.skipped.length ? "skipped" : "success", actorId: input.actorUserId, recipientId: input.recipientUserId, recipientCount: 1, afterDedupeCount: 1, successCount: result.error ? 0 : result.data ? 1 : 0, failedCount: result.error ? 1 : 0, skippedCount: preferences.skipped.length, durationMs: Date.now() - started, route: input.targetUrl, errorClass: result.error ? "notification_insert_failed" : preferences.lookupError ? "notification_preference_lookup_failed" : null, idempotencyKey: input.metadata?.idempotencyKey, recipientAnalysis: input.monitoringRecipientAnalysis, preferenceAnalysis: preferenceAudit(preferences) });
  return { ...result, data: result.data ? createNotificationDto(result.data) : null };
}

export async function createNotifications(inputs, { db }) {
  const started = Date.now();
  const preferences = await filterRecipientsByNotificationPreferences(db, inputs);
  const result = preferences.allowed.length ? await repository.insertNotificationsInRepository(db, preferences.allowed.map(createPayload)) : { data: [], error: null };
  await recordNotificationMonitoringEvent({ type: inputs[0]?.type, status: result.error ? "failed" : preferences.skipped.length ? "warning" : "success", actorId: inputs[0]?.actorUserId, recipientId: inputs.length === 1 ? inputs[0]?.recipientUserId : null, recipientCount: inputs.length, afterDedupeCount: inputs.length, successCount: result.error ? 0 : result.data?.length || 0, failedCount: result.error ? preferences.allowed.length : 0, skippedCount: preferences.skipped.length, durationMs: Date.now() - started, route: inputs[0]?.targetUrl, errorClass: result.error ? "notification_insert_failed" : preferences.lookupError ? "notification_preference_lookup_failed" : null, idempotencyKey: inputs[0]?.metadata?.idempotencyKey, recipientAnalysis: inputs[0]?.monitoringRecipientAnalysis, preferenceAnalysis: preferenceAudit(preferences) });
  return { ...result, data: createNotificationDtos(result.data || []) };
}

export async function createNotificationsOnce(inputs, { db }) {
  const started = Date.now();
  const payloads = inputs.map(createPayload);
  if (!payloads.length) return { data: [], error: null };
  const existing = await repository.loadPotentialDuplicateNotifications(
    db,
    [...new Set(payloads.map((item) => item.recipient_user_id))],
    [...new Set(payloads.map((item) => item.type))],
    new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  );
  if (existing.error) {
    await recordNotificationMonitoringEvent({ type: inputs[0]?.type, status: "failed", actorId: inputs[0]?.actorUserId, recipientCount: inputs.length, failedCount: inputs.length, durationMs: Date.now() - started, route: inputs[0]?.targetUrl, errorClass: "idempotency_lookup_failed", idempotencyKey: inputs[0]?.metadata?.idempotencyKey, recipientAnalysis: inputs[0]?.monitoringRecipientAnalysis });
    return { data: [], error: existing.error };
  }
  const existingKeys = new Set((existing.data || []).map((row) => `${row.recipient_user_id}:${row.type}:${row.metadata?.idempotencyKey || ""}`));
  const unique = [...new Map(payloads.map((item) => [`${item.recipient_user_id}:${item.type}:${item.metadata?.idempotencyKey || ""}`, item])).values()]
    .filter((item) => !existingKeys.has(`${item.recipient_user_id}:${item.type}:${item.metadata?.idempotencyKey || ""}`));
  const duplicateCount = payloads.length - unique.length;
  if (!unique.length) {
    await recordNotificationMonitoringEvent({ type: inputs[0]?.type, status: "duplicate", actorId: inputs[0]?.actorUserId, recipientCount: inputs.length, afterDedupeCount: 0, duplicateCount, skippedCount: duplicateCount, durationMs: Date.now() - started, route: inputs[0]?.targetUrl, errorClass: "idempotency_duplicate", idempotencyKey: inputs[0]?.metadata?.idempotencyKey, recipientAnalysis: inputs[0]?.monitoringRecipientAnalysis });
    return { data: [], error: null };
  }
  const uniqueInputs = unique.map((payload) => inputs.find((input) => input.recipientUserId === payload.recipient_user_id && input.type === payload.type && (input.metadata?.idempotencyKey || "") === (payload.metadata?.idempotencyKey || "")));
  const preferences = await filterRecipientsByNotificationPreferences(db, uniqueInputs);
  const allowedKeys = new Set(preferences.allowed.map((item) => `${item.recipientUserId}:${item.type}:${item.metadata?.idempotencyKey || ""}`));
  const allowedPayloads = unique.filter((item) => allowedKeys.has(`${item.recipient_user_id}:${item.type}:${item.metadata?.idempotencyKey || ""}`));
  const result = allowedPayloads.length ? await repository.insertNotificationsInRepository(db, allowedPayloads) : { data: [], error: null };
  const preferenceSkipped = preferences.skipped.length;
  await recordNotificationMonitoringEvent({ type: inputs[0]?.type, status: result.error ? "failed" : duplicateCount || preferenceSkipped ? "warning" : "success", actorId: inputs[0]?.actorUserId, recipientId: allowedPayloads.length === 1 ? allowedPayloads[0].recipient_user_id : null, recipientCount: inputs.length, afterDedupeCount: unique.length, successCount: result.error ? 0 : result.data?.length || 0, failedCount: result.error ? allowedPayloads.length : 0, duplicateCount, skippedCount: duplicateCount + preferenceSkipped, durationMs: Date.now() - started, route: inputs[0]?.targetUrl, errorClass: result.error ? "notification_insert_failed" : preferences.lookupError ? "notification_preference_lookup_failed" : duplicateCount ? "idempotency_duplicate" : null, idempotencyKey: inputs[0]?.metadata?.idempotencyKey, recipientAnalysis: inputs[0]?.monitoringRecipientAnalysis, preferenceAnalysis: preferenceAudit(preferences) });
  return { ...result, data: createNotificationDtos(result.data || []) };
}

export async function loadNotifications({ db, userId, limit = 100 }) {
  const result = await repository.loadNotificationsFromRepository(db, userId, { limit });
  return { ...result, data: createNotificationDtos(result.data || []) };
}

export async function loadUnreadNotifications({ db, userId, limit = 20 }) {
  const result = await repository.loadNotificationsFromRepository(db, userId, { limit, unreadOnly: true });
  return { ...result, data: createNotificationDtos(result.data || []) };
}

export async function loadUnreadCount({ db, userId }) {
  const result = await repository.loadUnreadCountFromRepository(db, userId);
  return { ...result, data: result.count || 0 };
}

export async function markAsRead({ db, userId, id }) {
  const result = await repository.markNotificationReadInRepository(db, userId, id, new Date().toISOString());
  return { ...result, data: result.data ? createNotificationDto(result.data) : null };
}

export function markAllAsRead({ db, userId }) {
  return repository.markAllNotificationsReadInRepository(db, userId, new Date().toISOString());
}

export function deleteNotification({ db, userId, id }) {
  return repository.deleteNotificationFromRepository(db, userId, id);
}

export function deleteAllRead({ db, userId }) {
  return repository.deleteAllReadFromRepository(db, userId);
}
