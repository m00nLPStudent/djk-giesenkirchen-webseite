import "server-only";
import { randomUUID } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import { createMediaStoragePath, MEDIA_BUCKETS, normalizeMediaMetadata, validateMediaDescriptor } from "./mediaValidation.core.mjs";
import * as repository from "./media.repository";
import { buildMediaAssignmentPayload } from "./mediaAssignment.core.mjs";

export const canManageMedia = (roles = []) => roles.some((role) => ["superadmin", "webmaster"].includes(role?.key));
const withPickerFields = (asset) => ({ ...asset, displayName: asset.display_name, storageBucket: asset.storage_bucket, storagePath: asset.storage_path, mediaKind: asset.media_kind, visibility: asset.visibility });

export async function loadMediaLibrary(filters = {}) {
  const db = createSupabaseAdminClient();
  if (!db) return { data: [], error: new Error("Media-Service-Client ist nicht konfiguriert.") };
  const result = await repository.listMediaAssets(db, filters);
  if (result.error) return result;
  const assets = result.data || [];
  const privateAssets = assets.filter((asset) => asset.visibility !== "public");
  const signedByPath = new Map();
  if (privateAssets.length) {
    const signed = await db.storage.from("media-library-private").createSignedUrls(privateAssets.map((asset) => asset.storage_path), 300);
    if (signed.error) return { data: [], count: 0, error: signed.error };
    for (const item of signed.data || []) signedByPath.set(item.path, item.signedUrl);
  }
  const data = assets.map((asset) => withPickerFields({ ...asset, previewUrl: asset.visibility === "public" ? db.storage.from(asset.storage_bucket).getPublicUrl(asset.storage_path).data.publicUrl : signedByPath.get(asset.storage_path) || null }));
  return { data, count: result.count || 0, error: null };
}

export async function loadMediaAssetForPicker(id) {
  if (!id) return { data: null, error: null };
  const db = createSupabaseAdminClient();
  if (!db) return { data: null, error: new Error("Media-Service-Client ist nicht konfiguriert.") };
  const result = await repository.loadMediaAsset(db, id);
  if (result.error || !result.data) return result;
  const asset = result.data;
  const previewUrl = asset.visibility === "public" ? db.storage.from(asset.storage_bucket).getPublicUrl(asset.storage_path).data.publicUrl : (await db.storage.from(asset.storage_bucket).createSignedUrl(asset.storage_path, 300)).data?.signedUrl || null;
  return { data: withPickerFields({ ...asset, previewUrl }), error: null };
}

export async function loadPublicMediaUrlMap(ids = []) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (!uniqueIds.length) return { data: new Map(), error: null };
  const db = createSupabaseAdminClient();
  if (!db) return { data: new Map(), error: new Error("Media-Service-Client ist nicht konfiguriert.") };
  const result = await db.from("media_assets")
    .select("id, storage_bucket, storage_path, media_kind, visibility, is_archived")
    .in("id", uniqueIds).eq("visibility", "public").eq("storage_bucket", "media-library-public")
    .eq("media_kind", "image").eq("is_archived", false);
  if (result.error) return { data: new Map(), error: result.error };
  return { data: new Map((result.data || []).map((asset) => [asset.id, db.storage.from(asset.storage_bucket).getPublicUrl(asset.storage_path).data.publicUrl])), error: null };
}

export async function loadMediaUrlMap(ids = [], allowedVisibilities = ["public"]) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (!uniqueIds.length) return { data: new Map(), error: null };
  const db = createSupabaseAdminClient();
  if (!db) return { data: new Map(), error: new Error("Media-Service-Client ist nicht konfiguriert.") };
  const result = await db.from("media_assets").select("id, storage_bucket, storage_path, visibility").in("id", uniqueIds).in("visibility", allowedVisibilities).eq("media_kind", "image").eq("is_archived", false);
  if (result.error) return { data: new Map(), error: result.error };
  const assets = result.data || [];
  const privateAssets = assets.filter((asset) => asset.visibility !== "public");
  const signed = privateAssets.length ? await db.storage.from("media-library-private").createSignedUrls(privateAssets.map((asset) => asset.storage_path), 300) : { data: [], error: null };
  if (signed.error) return { data: new Map(), error: signed.error };
  const signedByPath = new Map((signed.data || []).map((item) => [item.path, item.signedUrl]));
  return { data: new Map(assets.map((asset) => [asset.id, asset.visibility === "public" ? db.storage.from(asset.storage_bucket).getPublicUrl(asset.storage_path).data.publicUrl : signedByPath.get(asset.storage_path) || null])), error: null };
}

export async function resolveEntityImageMedia(id, { allowArchived = false, allowedVisibilities = ["public"], purpose } = {}) {
  if (!id) return { data: null, error: null };
  const result = await loadMediaAssetForPicker(id);
  if (result.error || !result.data) return { data: null, error: result.error || new Error("Das ausgewählte Medium wurde nicht gefunden.") };
  if ((!allowArchived && result.data.is_archived) || result.data.media_kind !== "image" || (purpose && result.data.purpose !== purpose) || !allowedVisibilities.includes(result.data.visibility)) return { data: null, error: new Error("Dieses Bild ist für den aktuellen Zugriff nicht auswählbar.") };
  return { data: result.data, error: null };
}

export function resolvePublicCoachMedia(id, options = {}) { return resolveEntityImageMedia(id, { ...options, purpose: "coach" }); }

export async function synchronizeMediaAssignment(entityType, entityId, mediaAssetId) {
  const assignment = buildMediaAssignmentPayload(entityType, entityId, mediaAssetId);
  if (!assignment.ok) return { error: assignment.error };
  const db = createSupabaseAdminClient();
  if (!db) return { error: new Error("Media-Service-Client ist nicht konfiguriert.") };
  const result = await repository.synchronizeMediaAssignment(db, assignment.payload);
  return { data: result.data || null, error: result.error || null };
}

export async function uploadMediaAsset(file, input, actorUserId) {
  try {
    if (!(file instanceof File)) return { data: null, error: new Error("Keine Datei ausgewählt."), stage: "validation" };
    const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    const validation = validateMediaDescriptor({ name: file.name, type: file.type, size: file.size, bytes: header });
    if (!validation.ok) return { data: null, error: new Error(validation.error), stage: "validation" };
    const metadata = normalizeMediaMetadata(input);
    const id = randomUUID();
    const bucket = MEDIA_BUCKETS[metadata.visibility];
    const path = createMediaStoragePath({ purpose: metadata.purpose, id, extension: validation.extension, mediaKind: validation.mediaKind });
    const db = createSupabaseAdminClient();
    if (!db) return { data: null, error: new Error("Media-Service-Client ist nicht konfiguriert."), stage: "configuration" };
    const upload = await db.storage.from(bucket).upload(path, file, { cacheControl: "3600", contentType: file.type, upsert: false });
    if (upload.error) return { data: null, error: upload.error, stage: "storage_upload" };
    const saved = await repository.insertMediaAsset(db, { id, storage_bucket: bucket, storage_path: path, original_filename: validation.originalFilename, display_name: metadata.displayName || validation.originalFilename, media_kind: validation.mediaKind, mime_type: file.type, file_extension: validation.extension, file_size_bytes: file.size, alt_text: metadata.altText, description: metadata.description, copyright_notice: metadata.copyrightNotice, source_label: metadata.sourceLabel, visibility: metadata.visibility, purpose: metadata.purpose, uploaded_by_user_id: actorUserId });
    if (!saved.error) return { ...saved, stage: "complete" };
    const rollback = await db.storage.from(bucket).remove([path]);
    return { ...saved, stage: "media_assets_insert", rollbackAttempted: true, rollbackError: rollback.error || null };
  } catch (error) {
    return { data: null, error, stage: "unexpected" };
  }
}

export async function archiveMediaAsset(id) {
  const db = createSupabaseAdminClient();
  if (!db) return { data: null, error: new Error("Media-Service-Client ist nicht konfiguriert.") };
  const asset = await repository.loadMediaAsset(db, id);
  if (asset.error || !asset.data) return asset;
  if (asset.data.media_asset_usages?.length) return { data: null, error: new Error("Das Medium wird noch verwendet und kann nur nach Auflösung aller Verwendungen archiviert werden.") };
  return repository.archiveMediaAsset(db, id);
}
