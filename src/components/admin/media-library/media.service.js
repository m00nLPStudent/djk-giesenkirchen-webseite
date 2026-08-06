import "server-only";
import { randomUUID } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import { createMediaStoragePath, MEDIA_BUCKETS, normalizeMediaMetadata, validateMediaDescriptor } from "./mediaValidation.core.mjs";
import * as repository from "./media.repository";

export const canManageMedia = (roles = []) => roles.some((role) => ["superadmin", "webmaster"].includes(role?.key));

export async function loadMediaLibrary(filters = {}) {
  const db = createSupabaseAdminClient();
  if (!db) return { data: [], error: new Error("Media-Service-Client ist nicht konfiguriert.") };
  const result = await repository.listMediaAssets(db, filters);
  if (result.error) return result;
  const data = await Promise.all((result.data || []).map(async (asset) => {
    if (asset.visibility === "public") return { ...asset, previewUrl: db.storage.from(asset.storage_bucket).getPublicUrl(asset.storage_path).data.publicUrl };
    const signed = await db.storage.from(asset.storage_bucket).createSignedUrl(asset.storage_path, 300);
    return { ...asset, previewUrl: signed.data?.signedUrl || null };
  }));
  return { data, error: null };
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
