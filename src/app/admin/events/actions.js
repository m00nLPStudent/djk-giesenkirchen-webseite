"use server";

import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { logEditorialNotificationFailure, notifyEventWorkflow } from "@/components/admin/notifications/editorialNotifications.service";
import { canManageMedia, loadMediaLibrary, resolveEntityImageMedia, synchronizeMediaAssignment, uploadMediaAsset } from "@/components/admin/media-library/media.service";
import { normalizePickerPurpose } from "@/components/admin/media-library/mediaPurpose.config.mjs";

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
  const allowedVisibilities = canManageMedia(auth.roles) ? ["public", "admin"] : ["public"];
  const media = await resolveEntityImageMedia(payload?.image_media_asset_id || null, {
    allowArchived: Boolean(previous?.image_media_asset_id === payload?.image_media_asset_id),
    allowedVisibilities,
  });
  if (media.error) return { data: null, error: { message: media.error.message } };
  const { remove_legacy_image: removeLegacyImage, ...persistedPayload } = payload || {};
  const writePayload = {
    ...persistedPayload,
    image_url: removeLegacyImage === true ? null : persistedPayload.image_url || null,
    image_media_asset_id: media.data?.id || null,
    slug: uniqueSlug.slug,
  };
  const result = eventId
    ? await db.from("events").update(writePayload).eq("id", eventId).select("*").single()
    : await db.from("events").insert(writePayload).select("*").single();
  if (result.error) return result;
  const usage = await synchronizeMediaAssignment("event", result.data.id, media.data?.id || null);
  if (usage.error) {
    if (previous) await db.from("events").update(previous).eq("id", result.data.id);
    else await db.from("events").delete().eq("id", result.data.id);
    return { data: null, error: { message: "Die Terminbild-Verwendung konnte nicht gespeichert werden." } };
  }
  const notification = await notifyEventWorkflow({ previous, next: result.data, actorUserId: auth.userId });
  logEditorialNotificationFailure(eventId ? "event-updated" : "event-created", notification.error);
  return result;
}

async function authorizeEventMedia(eventId = null) {
  const auth = await assertAdminActionPermission({ requiredPermission: eventId ? "events.edit" : "events.create" });
  if (!auth.ok) return { ok: false, message: auth.message || "Berechtigung fehlt." };
  if (eventId) {
    const existing = await auth.supabaseServer.from("events").select("id").eq("id", eventId).maybeSingle();
    if (existing.error || !existing.data) return { ok: false, message: "Termin nicht gefunden." };
  }
  return { ok: true, auth };
}

export async function loadEventMediaPickerAction(filters = {}, eventId = null) {
  const authorization = await authorizeEventMedia(eventId);
  if (!authorization.ok) return { ok: false, error: authorization.message, items: [], total: 0 };
  const allowed = canManageMedia(authorization.auth.roles) ? ["public", "admin"] : ["public"];
  const visibility = allowed.includes(filters.visibility) ? filters.visibility : allowed;
  const purpose = normalizePickerPurpose(filters.purpose, "event");
  const result = await loadMediaLibrary({ ...filters, kind: "image", visibility, purpose, archived: "active" });
  return result.error
    ? { ok: false, error: "Medien konnten nicht geladen werden.", items: [], total: 0 }
    : { ok: true, items: result.data, total: result.count || 0 };
}

export async function uploadEventMediaAction(formData, eventId = null) {
  try {
    const authorization = await authorizeEventMedia(eventId);
    if (!authorization.ok) return { ok: false, error: authorization.message };
    const file = formData.get("file");
    if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return { ok: false, error: "Für Terminbilder sind nur JPEG, PNG und WebP erlaubt." };
    }
    const result = await uploadMediaAsset(file, {
      displayName: formData.get("displayName"),
      altText: formData.get("altText"),
      visibility: "public",
      purpose: "event",
    }, authorization.auth.profile.id);
    if (result.error) return { ok: false, error: result.stage === "validation" ? result.error.message : "Das Terminbild konnte nicht hochgeladen werden." };
    const resolved = await resolveEntityImageMedia(result.data.id, { purpose: "event" });
    return resolved.error ? { ok: false, error: "Das hochgeladene Terminbild konnte nicht geladen werden." } : { ok: true, item: resolved.data };
  } catch {
    return { ok: false, error: "Das Terminbild konnte nicht hochgeladen werden." };
  }
}
