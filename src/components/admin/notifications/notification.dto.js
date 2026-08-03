import { normalizeNotificationTarget, normalizeNotificationType } from "./notifications.core.mjs";

export function createNotificationDto(row = {}) {
  const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata : {};
  const detailOnly = metadata.notificationDetailOnly || metadata.accessLost || ["trainer_removed", "player_removed"].includes(row.type);
  return {
    id: row.id || null,
    title: row.title || "Benachrichtigung",
    message: row.message || "",
    type: normalizeNotificationType(row.type),
    targetUrl: detailOnly && row.id ? `/admin/notifications?notification=${encodeURIComponent(row.id)}` : normalizeNotificationTarget(row.target_url),
    entityType: row.entity_type || null,
    entityId: row.entity_id || null,
    createdAt: row.created_at || null,
    readAt: row.read_at || null,
    isRead: Boolean(row.is_read),
    actor: row.actor_user_id ? { id: row.actor_user_id } : null,
    metadata,
  };
}

export function createNotificationDtos(rows = []) {
  return rows.map(createNotificationDto);
}
