import "server-only";
import { createNotificationDto, createNotificationDtos } from "./notification.dto";
import { normalizeNotificationTarget, normalizeNotificationType } from "./notifications.core.mjs";
import * as repository from "./notifications.repository";

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
  const result = await repository.insertNotificationInRepository(db, createPayload(input));
  return { ...result, data: result.data ? createNotificationDto(result.data) : null };
}

export async function createNotifications(inputs, { db }) {
  const result = await repository.insertNotificationsInRepository(db, inputs.map(createPayload));
  return { ...result, data: createNotificationDtos(result.data || []) };
}

export async function createNotificationsOnce(inputs, { db }) {
  const payloads = inputs.map(createPayload);
  if (!payloads.length) return { data: [], error: null };
  const existing = await repository.loadPotentialDuplicateNotifications(
    db,
    [...new Set(payloads.map((item) => item.recipient_user_id))],
    [...new Set(payloads.map((item) => item.type))],
    new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  );
  if (existing.error) return { data: [], error: existing.error };
  const existingKeys = new Set((existing.data || []).map((row) => `${row.recipient_user_id}:${row.type}:${row.metadata?.idempotencyKey || ""}`));
  const unique = [...new Map(payloads.map((item) => [`${item.recipient_user_id}:${item.type}:${item.metadata?.idempotencyKey || ""}`, item])).values()]
    .filter((item) => !existingKeys.has(`${item.recipient_user_id}:${item.type}:${item.metadata?.idempotencyKey || ""}`));
  if (!unique.length) return { data: [], error: null };
  const result = await repository.insertNotificationsInRepository(db, unique);
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
