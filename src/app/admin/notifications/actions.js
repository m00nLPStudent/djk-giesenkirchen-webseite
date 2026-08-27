"use server";

import { revalidatePath } from "next/cache";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { deleteAllRead, deleteNotification, deleteSelectedNotifications, loadNotifications, loadUnreadCount, markAllAsRead, markAsRead } from "@/components/admin/notifications/notifications.service";
import { normalizeNotificationIds } from "@/components/admin/notifications/notifications.core.mjs";

async function getContext() {
  const auth = await assertAdminActionPermission({});
  if (!auth.ok) return auth;
  return { ok: true, db: auth.supabaseServer, userId: auth.userId };
}

export async function loadNotificationCenterAction({ limit = 8 } = {}) {
  const context = await getContext();
  if (!context.ok) return { ok: false, reason: context.reason, items: [], unreadCount: 0 };
  const [items, count] = await Promise.all([
    loadNotifications({ db: context.db, userId: context.userId, limit }),
    loadUnreadCount({ db: context.db, userId: context.userId }),
  ]);
  if (items.error || count.error) return { ok: true, available: false, items: [], unreadCount: 0 };
  return { ok: true, available: true, items: items.data, unreadCount: count.data };
}

export async function markNotificationReadAction(id) {
  const context = await getContext();
  if (!context.ok) return { ok: false, reason: context.reason };
  const result = await markAsRead({ db: context.db, userId: context.userId, id });
  if (!result.error) revalidatePath("/admin/notifications");
  return { ok: !result.error };
}

export async function markAllNotificationsReadAction() {
  const context = await getContext();
  if (!context.ok) return { ok: false, reason: context.reason };
  const result = await markAllAsRead({ db: context.db, userId: context.userId });
  if (!result.error) revalidatePath("/admin/notifications");
  return { ok: !result.error };
}

export async function deleteNotificationAction(id) {
  const context = await getContext();
  if (!context.ok) return { ok: false, reason: context.reason };
  const result = await deleteNotification({ db: context.db, userId: context.userId, id });
  if (!result.error) revalidatePath("/admin/notifications");
  return { ok: !result.error };
}

export async function deleteSelectedNotificationsAction(ids) {
  const context = await getContext();
  if (!context.ok) return { ok: false, reason: context.reason, deletedCount: 0 };
  const normalized = normalizeNotificationIds(ids);
  if (!normalized.ok) return { ok: false, reason: normalized.reason, deletedCount: 0 };
  const result = await deleteSelectedNotifications({ db: context.db, userId: context.userId, notificationIds: normalized.ids });
  if (!result.error) revalidatePath("/admin/notifications");
  return { ok: !result.error, reason: result.error ? "delete_failed" : null, deletedCount: result.deletedCount };
}

export async function deleteAllReadNotificationsAction() {
  const context = await getContext();
  if (!context.ok) return { ok: false, reason: context.reason };
  const result = await deleteAllRead({ db: context.db, userId: context.userId });
  if (!result.error) revalidatePath("/admin/notifications");
  return { ok: !result.error };
}
