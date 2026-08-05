"use server";

import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { logEditorialNotificationFailure, notifyEventWorkflow } from "@/components/admin/notifications/editorialNotifications.service";

async function buildUniqueSlug(db, slug, ignoreId = null) {
  if (!slug) return null;
  let candidate = slug;
  let suffix = 2;
  while (true) {
    let query = db.from("events").select("id").eq("slug", candidate).limit(1);
    if (ignoreId) query = query.neq("id", ignoreId);
    const result = await query;
    if (result.error) return { error: result.error };
    if (!result.data?.length) return { slug: candidate };
    candidate = `${slug}-${suffix++}`;
  }
}

export async function saveEventWithNotificationAction(payload, eventId = null) {
  const auth = await assertAdminActionPermission({ requiredPermission: eventId ? "events.edit" : "events.create" });
  if (!auth.ok) return { data: null, error: { message: auth.message || "Berechtigung fehlt." } };
  const db = auth.supabaseServer;
  let previous = null;
  if (eventId) {
    const snapshot = await db.from("events").select("*").eq("id", eventId).maybeSingle();
    if (snapshot.error || !snapshot.data) return { data: null, error: snapshot.error || { message: "Termin nicht gefunden." } };
    previous = snapshot.data;
  }
  const uniqueSlug = await buildUniqueSlug(db, payload?.slug, eventId);
  if (uniqueSlug.error) return { data: null, error: uniqueSlug.error };
  const writePayload = { ...payload, slug: uniqueSlug.slug };
  const result = eventId
    ? await db.from("events").update(writePayload).eq("id", eventId).select("*").single()
    : await db.from("events").insert(writePayload).select("*").single();
  if (result.error) return result;
  const notification = await notifyEventWorkflow({ previous, next: result.data, actorUserId: auth.userId });
  logEditorialNotificationFailure(eventId ? "event-updated" : "event-created", notification.error);
  return result;
}
