"use server";

import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { resolveNewsAuthorName, sanitizeNewsWritePayload } from "@/components/admin/news/helpers/newsAuthor.core.mjs";
import { canManageMedia, loadMediaLibrary, loadMediaUrlMap, loadPublicMediaUrlMap, resolveEntityDocumentMedia, resolveEntityImageMedia, synchronizeMediaAssignment, synchronizeNewsContentMediaUsages, uploadMediaAsset } from "@/components/admin/media-library/media.service";
import { normalizePickerPurpose } from "@/components/admin/media-library/mediaPurpose.config.mjs";
import { extractNewsInlineMediaAssetIds, hasInvalidNewsInlineMediaAssetIds, hasNewTransientImageSources, rewriteCentralMediaImageSources } from "@/components/admin/news/helpers/newsInlineMedia.core.mjs";
import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import { revalidatePublicContentAction } from "@/app/admin/actions/publicContentRevalidation";

async function prepareNewsInlineContent(content, previousContent = "") {
  if (hasNewTransientImageSources(content, previousContent)) return { error: "Eingefügte Bilder müssen zuerst über die Medienbibliothek hochgeladen werden." };
  if (hasInvalidNewsInlineMediaAssetIds(content)) return { error: "Der News-Inhalt enthält eine ungültige Medienreferenz." };
  const ids = extractNewsInlineMediaAssetIds(content);
  const media = await loadPublicMediaUrlMap(ids, "image");
  if (media.error || media.data.size !== ids.length) return { error: "Mindestens ein Inline-Bild ist nicht öffentlich verfügbar oder nicht mehr auswählbar." };
  return { content: rewriteCentralMediaImageSources(content, media.data), ids };
}

async function resolveAuthorName(db, profile) {
  const { data } = await db.from("admin_profiles").select("full_name, email").eq("id", profile.id).maybeSingle();
  return resolveNewsAuthorName(data || profile);
}

export async function deleteNewsAction(newsId) {
  const permission = await assertAdminActionPermission({ requiredPermission: "news.delete" });
  if (!permission.ok) return { data: null, error: { message: permission.message || "Berechtigung fehlt." } };
  const db = createSupabaseAdminClient();
  if (!db) return { data: null, error: { message: "News-Service ist nicht konfiguriert." } };
  const existing = await db.from("news").select("id").eq("id", newsId).maybeSingle();
  if (existing.error || !existing.data) return { data: null, error: { message: "News nicht gefunden." } };
  const result = await db.from("news").delete().eq("id", newsId);
  if (!result.error) await revalidatePublicContentAction("news");
  return result;
}

export async function saveNewsWithAuthorAction(payload, newsId = null) {
  const permissionResult = await assertAdminActionPermission({ requiredPermission: newsId ? "news.edit" : "news.create" });
  if (!permissionResult.ok) return { data: null, error: { message: permissionResult.message || "Berechtigung fehlt." } };

  const db = permissionResult.supabaseServer;
  const allowedVisibilities = canManageMedia(permissionResult.roles) ? ["public", "admin"] : ["public"];
  let existing = null;
  if (newsId) {
    const existingResult = await db.from("news").select("id, author, image_url, image_media_asset_id, content_de").eq("id", newsId).maybeSingle();
    if (existingResult.error || !existingResult.data) return { data: null, error: existingResult.error || { message: "News nicht gefunden." } };
    existing = existingResult.data;
  }
  const media = await resolveEntityImageMedia(payload?.image_media_asset_id || null, { allowArchived: Boolean(existing?.image_media_asset_id === payload?.image_media_asset_id), allowedVisibilities });
  if (media.error) return { data: null, error: { message: media.error.message } };
  const inline = await prepareNewsInlineContent(payload?.content_de || "", existing?.content_de || "");
  if (inline.error) return { data: null, error: { message: inline.error } };
  const safePayload = sanitizeNewsWritePayload({ ...payload, content_de: inline.content, image_url: payload?.remove_legacy_image === true ? null : payload?.image_url || null });

  if (newsId) {
    const saved = await db.from("news").update({ ...safePayload, author: existing.author }).eq("id", newsId).select("*").single();
    if (saved.error) return saved;
    const usage = await synchronizeMediaAssignment("news", saved.data.id, media.data?.id || null);
    if (usage.error) return { data: null, error: { message: "Die News-Titelbild-Verwendung konnte nicht gespeichert werden." } };
    const inlineUsage = await synchronizeNewsContentMediaUsages(saved.data.id, inline.ids);
    if (inlineUsage.error) {
      console.error("[news-inline-media]", { stage: "update_usage", code: inlineUsage.error.code || "INLINE_USAGE_SYNC_FAILED" });
      await db.from("news").update({ content_de: existing.content_de }).eq("id", saved.data.id);
      return { data: null, error: { message: "Die Inline-Bildverwendungen konnten nicht gespeichert werden." } };
    }
    return { ...saved, data: { ...saved.data, image_media_asset_id: media.data?.id || null } };
  }

  const author = await resolveAuthorName(db, permissionResult.profile);
  const saved = await db.from("news").insert({ ...safePayload, author }).select("*").single();
  if (saved.error) return saved;
  const usage = await synchronizeMediaAssignment("news", saved.data.id, media.data?.id || null);
  if (usage.error) return { data: null, error: { message: "Die News-Titelbild-Verwendung konnte nicht gespeichert werden." } };
  const inlineUsage = await synchronizeNewsContentMediaUsages(saved.data.id, inline.ids);
  if (inlineUsage.error) {
    console.error("[news-inline-media]", { stage: "create_usage", code: inlineUsage.error.code || "INLINE_USAGE_SYNC_FAILED" });
    await db.from("news").delete().eq("id", saved.data.id);
    return { data: null, error: { message: "Die Inline-Bildverwendungen konnten nicht gespeichert werden." } };
  }
  return { ...saved, data: { ...saved.data, image_media_asset_id: media.data?.id || null } };
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

export async function loadNewsInlineMediaPickerAction(filters = {}, newsId = null) {
  const auth = await authorizeNewsMedia(newsId);
  if (!auth.ok) return { ok: false, error: auth.message, items: [], total: 0 };
  const purpose = normalizePickerPurpose(filters.purpose, "news");
  const result = await loadMediaLibrary({ ...filters, kind: "image", visibility: "public", purpose, archived: "active" });
  return result.error ? { ok: false, error: "Inline-Bilder konnten nicht geladen werden.", items: [], total: 0 } : { ok: true, items: result.data, total: result.count || 0 };
}

export async function uploadNewsInlineMediaAction(formData, newsId = null) {
  return uploadNewsMediaAction(formData, newsId);
}

const documentError = (message) => ({ data: null, error: { message } });
const logNewsDocumentError = (stage, error) => console.error("[news-document]", { stage, code: error?.code || "NEWS_DOCUMENT_OPERATION_FAILED" });

export async function loadNewsDocumentsAction(newsId) {
  const auth = await authorizeNewsMedia(newsId);
  if (!auth.ok) return documentError(auth.message);
  const result = await auth.permissionResult.supabaseServer.from("news_documents").select("*").eq("news_id", newsId).order("sort_order").order("created_at");
  if (result.error) return result;
  const allowed = canManageMedia(auth.permissionResult.roles) ? ["public", "admin"] : ["public"];
  const media = await loadMediaUrlMap((result.data || []).map((item) => item.media_asset_id), allowed, "document");
  if (media.error) return documentError("Dokumente konnten nicht aufgelöst werden.");
  return { data: (result.data || []).map((item) => ({ ...item, resolved_file_url: media.data.get(item.media_asset_id) || item.file_url || null })), error: null };
}

export async function loadNewsDocumentPickerAction(filters = {}, newsId) {
  const auth = await authorizeNewsMedia(newsId);
  if (!auth.ok) return { ok: false, error: auth.message, items: [], total: 0 };
  const allowed = canManageMedia(auth.permissionResult.roles) ? ["public", "admin"] : ["public"];
  const visibility = allowed.includes(filters.visibility) ? filters.visibility : allowed;
  const purpose = normalizePickerPurpose(filters.purpose, "news", "document");
  const result = await loadMediaLibrary({ ...filters, kind: "document", visibility, purpose, archived: "active" });
  return result.error ? { ok: false, error: "Dokumente konnten nicht geladen werden.", items: [], total: 0 } : { ok: true, items: result.data, total: result.count || 0 };
}

export async function uploadNewsDocumentMediaAction(formData, newsId) {
  const auth = await authorizeNewsMedia(newsId);
  if (!auth.ok) return { ok: false, error: auth.message };
  const file = formData.get("file");
  if (!file || file.type !== "application/pdf") return { ok: false, error: "Für News-Dokumente sind zentral ausschließlich PDF-Dateien erlaubt." };
  const result = await uploadMediaAsset(file, { displayName: formData.get("displayName"), visibility: "public", purpose: "news" }, auth.permissionResult.profile.id);
  if (result.error) return { ok: false, error: result.stage === "validation" ? result.error.message : "Das News-Dokument konnte nicht hochgeladen werden." };
  const resolved = await resolveEntityDocumentMedia(result.data.id, { allowedVisibilities: ["public"] });
  return resolved.error ? { ok: false, error: resolved.error.message } : { ok: true, item: resolved.data };
}

export async function createNewsDocumentAction(newsId, mediaAssetId) {
  const auth = await authorizeNewsMedia(newsId);
  if (!auth.ok) return documentError(auth.message);
  const allowed = canManageMedia(auth.permissionResult.roles) ? ["public", "admin"] : ["public"];
  const media = await resolveEntityDocumentMedia(mediaAssetId, { allowedVisibilities: allowed });
  if (media.error) return documentError(media.error.message);
  const asset = media.data;
  const saved = await auth.permissionResult.supabaseServer.from("news_documents").insert({ news_id: newsId, media_asset_id: asset.id, display_name_de: asset.display_name || asset.original_filename, file_name: asset.original_filename, mime_type: asset.mime_type, file_size: asset.file_size_bytes, is_public: asset.visibility === "public", sort_order: 0 }).select("*").single();
  if (saved.error) {
    logNewsDocumentError("create", saved.error);
    return documentError("Das News-Dokument konnte nicht hinzugefügt werden.");
  }
  const usage = await synchronizeMediaAssignment("news_document", saved.data.id, asset.id, "file");
  if (usage.error) {
    await auth.permissionResult.supabaseServer.from("news_documents").delete().eq("id", saved.data.id);
    return documentError("Die Dokumentverwendung konnte nicht gespeichert werden.");
  }
  return { data: { ...saved.data, resolved_file_url: asset.previewUrl }, error: null };
}

export async function replaceNewsDocumentFileAction(documentId, mediaAssetId) {
  const permission = await assertAdminActionPermission({ requiredPermission: "news.edit" });
  if (!permission.ok) return documentError(permission.message || "Berechtigung fehlt.");
  const current = await permission.supabaseServer.from("news_documents").select("id,news_id,media_asset_id").eq("id", documentId).maybeSingle();
  if (current.error || !current.data) return documentError("Dokument nicht gefunden.");
  const allowed = canManageMedia(permission.roles) ? ["public", "admin"] : ["public"];
  const media = await resolveEntityDocumentMedia(mediaAssetId, { allowedVisibilities: allowed });
  if (media.error) return documentError(media.error.message);
  const usage = await synchronizeMediaAssignment("news_document", documentId, media.data.id, "file");
  if (usage.error) return documentError("Die Dokumentverwendung konnte nicht gespeichert werden.");
  const saved = await permission.supabaseServer.from("news_documents").update({ file_name: media.data.original_filename, mime_type: media.data.mime_type, file_size: media.data.file_size_bytes }).eq("id", documentId).select("*").single();
  if (saved.error) {
    logNewsDocumentError("replace_metadata", saved.error);
    return documentError("Die Dokumentdatei wurde verknüpft, aber ihre Anzeigeinformationen konnten nicht aktualisiert werden.");
  }
  return { data: { ...saved.data, resolved_file_url: media.data.previewUrl }, error: null };
}

export async function updateNewsDocumentAction(documentId, updates = {}) {
  const permission = await assertAdminActionPermission({ requiredPermission: "news.edit" });
  if (!permission.ok) return documentError(permission.message || "Berechtigung fehlt.");
  const allowed = ["display_name_de", "description_de", "sort_order", "is_public"];
  const safe = Object.fromEntries(Object.entries(updates).filter(([key]) => allowed.includes(key)));
  if ("sort_order" in safe) safe.sort_order = Math.max(0, Math.trunc(Number(safe.sort_order) || 0));
  return permission.supabaseServer.from("news_documents").update(safe).eq("id", documentId).select("*").maybeSingle();
}

export async function deleteNewsDocumentAction(documentId) {
  const permission = await assertAdminActionPermission({ requiredPermission: "news.edit" });
  if (!permission.ok) return documentError(permission.message || "Berechtigung fehlt.");
  const current = await permission.supabaseServer.from("news_documents").select("id,media_asset_id,file_path").eq("id", documentId).maybeSingle();
  if (current.error || !current.data) return documentError("Dokument nicht gefunden.");
  if (!current.data.media_asset_id && current.data.file_path) {
    const removed = await permission.supabaseServer.storage.from("news-documents").remove([decodeURIComponent(current.data.file_path)]);
    if (removed.error) return documentError(removed.error.message);
  }
  return permission.supabaseServer.from("news_documents").delete().eq("id", documentId);
}
