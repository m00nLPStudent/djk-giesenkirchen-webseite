"use server";

import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { logEditorialNotificationFailure, notifyEventWorkflow } from "@/components/admin/notifications/editorialNotifications.service";
import { canManageMedia, loadMediaLibrary, loadMediaUrlMap, resolveEntityDocumentMedia, resolveEntityImageMedia, synchronizeMediaAssignment, uploadMediaAsset } from "@/components/admin/media-library/media.service";
import { normalizePickerPurpose } from "@/components/admin/media-library/mediaPurpose.config.mjs";
import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import { requiresPublishPermission } from "@/lib/admin-auth/publishPermission.core.mjs";

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
  const db = createSupabaseAdminClient();
  if (!db) return { data: null, error: { message: "Termin-Service ist nicht konfiguriert." } };
  let previous = null;
  if (eventId) {
    const snapshot = await db.from("events").select("*").eq("id", eventId).maybeSingle();
    if (snapshot.error || !snapshot.data) return { data: null, error: snapshot.error || { message: "Termin nicht gefunden." } };
    previous = snapshot.data;
  }
  if (requiresPublishPermission(previous, payload)) {
    const publishPermission = await assertAdminActionPermission({ requiredPermission: "events.publish", supabaseServer: auth.supabaseServer });
    if (!publishPermission.ok) return { data: null, error: { message: publishPermission.message || "Berechtigung zum Veröffentlichen fehlt." } };
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

const eventDocumentError = (message) => ({ data: null, error: { message } });
const getEventDocumentAdminClient = () => createSupabaseAdminClient();

export async function loadEventDocumentsAction(eventId) {
  const authorization = await authorizeEventMedia(eventId);
  if (!authorization.ok) return eventDocumentError(authorization.message);
  const db = getEventDocumentAdminClient();
  if (!db) return eventDocumentError("Event-Dokument-Service ist nicht konfiguriert.");
  const result = await db.from("event_documents").select("*").eq("event_id", eventId).order("sort_order").order("created_at");
  if (result.error) return result;
  const allowed = canManageMedia(authorization.auth.roles) ? ["public", "admin"] : ["public"];
  const media = await loadMediaUrlMap((result.data || []).map((item) => item.media_asset_id), allowed, "document");
  if (media.error) return eventDocumentError("Dokumente konnten nicht aufgelöst werden.");
  return { data: (result.data || []).map((item) => ({ ...item, resolved_file_url: media.data.get(item.media_asset_id) || item.file_url || null })), error: null };
}

export async function loadEventDocumentPickerAction(filters = {}, eventId) {
  const authorization = await authorizeEventMedia(eventId);
  if (!authorization.ok) return { ok: false, error: authorization.message, items: [], total: 0 };
  const allowed = canManageMedia(authorization.auth.roles) ? ["public", "admin"] : ["public"];
  const visibility = allowed.includes(filters.visibility) ? filters.visibility : allowed;
  const purpose = normalizePickerPurpose(filters.purpose, "event", "document");
  const result = await loadMediaLibrary({ ...filters, kind: "document", visibility, purpose, archived: "active" });
  return result.error ? { ok: false, error: "Dokumente konnten nicht geladen werden.", items: [], total: 0 } : { ok: true, items: result.data, total: result.count || 0 };
}

export async function uploadEventDocumentMediaAction(formData, eventId) {
  const authorization = await authorizeEventMedia(eventId);
  if (!authorization.ok) return { ok: false, error: authorization.message };
  const file = formData.get("file");
  if (!file || file.type !== "application/pdf") return { ok: false, error: "Für Event-Dokumente sind zentral ausschließlich PDF-Dateien erlaubt." };
  const result = await uploadMediaAsset(file, { displayName: formData.get("displayName"), visibility: "public", purpose: "event" }, authorization.auth.profile.id);
  if (result.error) return { ok: false, error: result.stage === "validation" ? result.error.message : "Das Event-Dokument konnte nicht hochgeladen werden." };
  const resolved = await resolveEntityDocumentMedia(result.data.id, { allowedVisibilities: ["public"] });
  return resolved.error ? { ok: false, error: resolved.error.message } : { ok: true, item: resolved.data };
}

export async function createEventDocumentAction(eventId, mediaAssetId) {
  const authorization = await authorizeEventMedia(eventId);
  if (!authorization.ok) return eventDocumentError(authorization.message);
  const allowed = canManageMedia(authorization.auth.roles) ? ["public", "admin"] : ["public"];
  const media = await resolveEntityDocumentMedia(mediaAssetId, { allowedVisibilities: allowed });
  if (media.error) return eventDocumentError(media.error.message);
  const db = getEventDocumentAdminClient();
  if (!db) return eventDocumentError("Event-Dokument-Service ist nicht konfiguriert.");
  const asset = media.data;
  const saved = await db.from("event_documents").insert({
    event_id: eventId,
    media_asset_id: asset.id,
    display_name_de: asset.display_name || asset.original_filename,
    file_name: asset.original_filename,
    mime_type: asset.mime_type,
    file_size: asset.file_size_bytes,
    is_public: asset.visibility === "public",
    sort_order: 0,
  }).select("*").single();
  if (saved.error) return eventDocumentError("Das Event-Dokument konnte nicht hinzugefügt werden.");
  const usage = await synchronizeMediaAssignment("event_document", saved.data.id, asset.id, "file");
  if (usage.error) {
    await db.from("event_documents").delete().eq("id", saved.data.id);
    return eventDocumentError("Die Dokumentverwendung konnte nicht gespeichert werden.");
  }
  return { data: { ...saved.data, resolved_file_url: asset.previewUrl }, error: null };
}

export async function updateEventDocumentAction(documentId, updates = {}) {
  const permission = await assertAdminActionPermission({ requiredPermission: "events.edit" });
  if (!permission.ok) return eventDocumentError(permission.message || "Berechtigung fehlt.");
  const db = getEventDocumentAdminClient();
  if (!db) return eventDocumentError("Event-Dokument-Service ist nicht konfiguriert.");
  const current = await db.from("event_documents").select("id,event_id").eq("id", documentId).maybeSingle();
  if (current.error || !current.data) return eventDocumentError("Dokument nicht gefunden.");
  const allowed = ["display_name_de", "description_de", "sort_order", "is_public"];
  const safe = Object.fromEntries(Object.entries(updates).filter(([key]) => allowed.includes(key)));
  if ("sort_order" in safe) safe.sort_order = Math.max(0, Math.trunc(Number(safe.sort_order) || 0));
  return db.from("event_documents").update(safe).eq("id", documentId).select("*").maybeSingle();
}

export async function deleteEventDocumentAction(documentId) {
  const permission = await assertAdminActionPermission({ requiredPermission: "events.edit" });
  if (!permission.ok) return eventDocumentError(permission.message || "Berechtigung fehlt.");
  const db = getEventDocumentAdminClient();
  if (!db) return eventDocumentError("Event-Dokument-Service ist nicht konfiguriert.");
  const current = await db.from("event_documents").select("id,media_asset_id,file_path").eq("id", documentId).maybeSingle();
  if (current.error || !current.data) return eventDocumentError("Dokument nicht gefunden.");
  if (!current.data.media_asset_id && current.data.file_path) {
    const removed = await db.storage.from("events-documents").remove([decodeURIComponent(current.data.file_path)]);
    if (removed.error) return eventDocumentError(removed.error.message);
  }
  return db.from("event_documents").delete().eq("id", documentId);
}
