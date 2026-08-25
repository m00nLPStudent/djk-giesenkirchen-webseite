"use server";

import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { resolveNewsAuthorName, sanitizeNewsWritePayload } from "@/components/admin/news/helpers/newsAuthor.core.mjs";
import { canManageMedia, loadMediaLibrary, resolveEntityImageMedia, synchronizeMediaAssignment, uploadMediaAsset } from "@/components/admin/media-library/media.service";
import { normalizePickerPurpose } from "@/components/admin/media-library/mediaPurpose.config.mjs";

async function resolveAuthorName(db, profile) {
  const { data } = await db.from("admin_profiles").select("full_name, email").eq("id", profile.id).maybeSingle();
  return resolveNewsAuthorName(data || profile);
}

export async function saveNewsWithAuthorAction(payload, newsId = null) {
  const permissionResult = await assertAdminActionPermission({ requiredPermission: newsId ? "news.edit" : "news.create" });
  if (!permissionResult.ok) return { data: null, error: { message: permissionResult.message || "Berechtigung fehlt." } };

  const db = permissionResult.supabaseServer;
  const allowedVisibilities = canManageMedia(permissionResult.roles) ? ["public", "admin"] : ["public"];
  let existing = null;
  if (newsId) {
    const existingResult = await db.from("news").select("id, author, image_url, image_media_asset_id").eq("id", newsId).maybeSingle();
    if (existingResult.error || !existingResult.data) return { data: null, error: existingResult.error || { message: "News nicht gefunden." } };
    existing = existingResult.data;
  }
  const media = await resolveEntityImageMedia(payload?.image_media_asset_id || null, { allowArchived: Boolean(existing?.image_media_asset_id === payload?.image_media_asset_id), allowedVisibilities });
  if (media.error) return { data: null, error: { message: media.error.message } };
  const safePayload = sanitizeNewsWritePayload({ ...payload, image_url: payload?.remove_legacy_image === true ? null : payload?.image_url || null });

  if (newsId) {
    const saved = await db.from("news").update({ ...safePayload, author: existing.author }).eq("id", newsId).select("*").single();
    if (saved.error) return saved;
    const usage = await synchronizeMediaAssignment("news", saved.data.id, media.data?.id || null);
    return usage.error ? { data: null, error: { message: "Die News-Titelbild-Verwendung konnte nicht gespeichert werden." } } : { ...saved, data: { ...saved.data, image_media_asset_id: media.data?.id || null } };
  }

  const author = await resolveAuthorName(db, permissionResult.profile);
  const saved = await db.from("news").insert({ ...safePayload, author }).select("*").single();
  if (saved.error) return saved;
  const usage = await synchronizeMediaAssignment("news", saved.data.id, media.data?.id || null);
  return usage.error ? { data: null, error: { message: "Die News-Titelbild-Verwendung konnte nicht gespeichert werden." } } : { ...saved, data: { ...saved.data, image_media_asset_id: media.data?.id || null } };
}

async function authorizeNewsMedia(newsId = null) {
  const permissionResult = await assertAdminActionPermission({ requiredPermission: newsId ? "news.edit" : "news.create" });
  if (!permissionResult.ok) return { ok: false, message: permissionResult.message || "Berechtigung fehlt." };
  if (newsId) {
    const { data } = await permissionResult.supabaseServer.from("news").select("id").eq("id", newsId).maybeSingle();
    if (!data) return { ok: false, message: "News nicht gefunden." };
  }
  return { ok: true, permissionResult };
}

export async function loadNewsMediaPickerAction(filters = {}, newsId = null) {
  const auth = await authorizeNewsMedia(newsId);
  if (!auth.ok) return { ok: false, error: auth.message, items: [], total: 0 };
  const allowed = canManageMedia(auth.permissionResult.roles) ? ["public", "admin"] : ["public"];
  const visibility = allowed.includes(filters.visibility) ? filters.visibility : allowed;
  const purpose = normalizePickerPurpose(filters.purpose, "news");
  const result = await loadMediaLibrary({ ...filters, kind: "image", visibility, purpose, archived: "active" });
  return result.error ? { ok: false, error: "Medien konnten nicht geladen werden.", items: [], total: 0 } : { ok: true, items: result.data, total: result.count || 0 };
}

export async function uploadNewsMediaAction(formData, newsId = null) {
  try {
    const auth = await authorizeNewsMedia(newsId);
    if (!auth.ok) return { ok: false, error: auth.message };
    const file = formData.get("file");
    if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) return { ok: false, error: "Für News-Titelbilder sind nur JPEG, PNG und WebP erlaubt." };
    const result = await uploadMediaAsset(file, { displayName: formData.get("displayName"), altText: formData.get("altText"), visibility: "public", purpose: "news" }, auth.permissionResult.profile.id);
    if (result.error) return { ok: false, error: result.stage === "validation" ? result.error.message : "Das News-Titelbild konnte nicht hochgeladen werden." };
    const resolved = await resolveEntityImageMedia(result.data.id, { purpose: "news" });
    return resolved.error ? { ok: false, error: "Das hochgeladene News-Titelbild konnte nicht geladen werden." } : { ok: true, item: resolved.data };
  } catch {
    return { ok: false, error: "Das News-Titelbild konnte nicht hochgeladen werden." };
  }
}
