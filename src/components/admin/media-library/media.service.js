import "server-only";
import { randomUUID } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import { createMediaStoragePath, MEDIA_BUCKETS, normalizeMediaMetadata, validateMediaDescriptor } from "./mediaValidation.core.mjs";
import * as repository from "./media.repository";

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

export async function resolvePublicCoachMedia(id, { allowArchived = false, allowedVisibilities = ["public"] } = {}) {
  if (!id) return { data: null, error: null };
  const result = await loadMediaAssetForPicker(id);
  if (result.error || !result.data) return { data: null, error: result.error || new Error("Das ausgewählte Medium wurde nicht gefunden.") };
  if ((!allowArchived && result.data.is_archived) || result.data.media_kind !== "image" || !allowedVisibilities.includes(result.data.visibility)) return { data: null, error: new Error("Dieses Trainerbild ist für den aktuellen Zugriff nicht auswählbar.") };
  return { data: result.data, error: null };
}

export async function syncCoachMediaUsage(coachId, mediaAssetId) {
  const db = createSupabaseAdminClient();
  if (!db) return { error: new Error("Media-Service-Client ist nicht konfiguriert.") };
  if (!mediaAssetId) return repository.removeMediaUsage(db, "coach", coachId, "image");
  return repository.upsertMediaUsage(db, { media_asset_id: mediaAssetId, entity_type: "coach", entity_id: coachId, field_name: "image" });
}

export async function uploadMediaAsset(file, input, actorUserId) {
  if (!(file instanceof File)) return { data: null, error: new Error("Keine Datei ausgewählt.") };
  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const validation = validateMediaDescriptor({ name: file.name, type: file.type, size: file.size, bytes: header });
  if (!validation.ok) return { data: null, error: new Error(validation.error) };
  const metadata = normalizeMediaMetadata(input);
  const id = randomUUID();
  const bucket = MEDIA_BUCKETS[metadata.visibility];
  const path = createMediaStoragePath({ purpose: metadata.purpose, id, extension: validation.extension, mediaKind: validation.mediaKind });
  const db = createSupabaseAdminClient();
  if (!db) return { data: null, error: new Error("Media-Service-Client ist nicht konfiguriert.") };
  const upload = await db.storage.from(bucket).upload(path, file, { cacheControl: "3600", contentType: file.type, upsert: false });
  if (upload.error) return { data: null, error: upload.error };
  const saved = await repository.insertMediaAsset(db, { id, storage_bucket: bucket, storage_path: path, original_filename: validation.originalFilename, display_name: metadata.displayName || validation.originalFilename, media_kind: validation.mediaKind, mime_type: file.type, file_extension: validation.extension, file_size_bytes: file.size, alt_text: metadata.altText, description: metadata.description, copyright_notice: metadata.copyrightNotice, source_label: metadata.sourceLabel, visibility: metadata.visibility, purpose: metadata.purpose, uploaded_by_user_id: actorUserId });
  if (saved.error) await db.storage.from(bucket).remove([path]);
  return saved;
}

export async function archiveMediaAsset(id) {
  const db = createSupabaseAdminClient();
  if (!db) return { data: null, error: new Error("Media-Service-Client ist nicht konfiguriert.") };
  const asset = await repository.loadMediaAsset(db, id);
  if (asset.error || !asset.data) return asset;
  if (asset.data.media_asset_usages?.length) return { data: null, error: new Error("Das Medium wird noch verwendet und kann nur nach Auflösung aller Verwendungen archiviert werden.") };
  return repository.archiveMediaAsset(db, id);
}
