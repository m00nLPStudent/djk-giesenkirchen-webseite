import "server-only";

const SELECT = "id, storage_bucket, storage_path, original_filename, display_name, media_kind, mime_type, file_extension, file_size_bytes, width, height, alt_text, description, copyright_notice, source_label, visibility, purpose, is_archived, uploaded_by_user_id, created_at, updated_at, media_asset_usages(id, entity_type, entity_id, field_name, created_at)";

export async function listMediaAssets(db, { search = "", kind = "all", visibility = "all", purpose = "all", archived = "active", sort = "newest", page = 1, pageSize = 100 } = {}) {
  const safePageSize = Math.min(Math.max(Number(pageSize) || 100, 1), 200);
  const safePage = Math.max(Number(page) || 1, 1);
  const from = (safePage - 1) * safePageSize;
  let query = db.from("media_assets").select(SELECT, { count: "exact" }).range(from, from + safePageSize - 1);
  if (archived === "active") query = query.eq("is_archived", false);
  if (archived === "archived") query = query.eq("is_archived", true);
  const safeSearch = search.trim().replace(/[%_,().]/g, " ").slice(0, 100);
  if (safeSearch) query = query.or(`display_name.ilike.%${safeSearch}%,original_filename.ilike.%${safeSearch}%,alt_text.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%,mime_type.ilike.%${safeSearch}%,purpose.ilike.%${safeSearch}%`);
  if (kind !== "all") query = query.eq("media_kind", kind);
  if (Array.isArray(visibility) && visibility.length) query = query.in("visibility", visibility);
  else if (visibility !== "all") query = query.eq("visibility", visibility);
  if (purpose !== "all") query = query.eq("purpose", purpose);
  const orders = { newest: ["created_at", false], oldest: ["created_at", true], name: ["display_name", true], largest: ["file_size_bytes", false] };
  const [column, ascending] = orders[sort] || orders.newest;
  return query.order(column, { ascending }).order("id", { ascending: true });
}

export function insertMediaAsset(db, payload) { return db.from("media_assets").insert(payload).select(SELECT).single(); }
export function archiveMediaAsset(db, id) { return db.from("media_assets").update({ is_archived: true }).eq("id", id).eq("is_archived", false).select("id").maybeSingle(); }
export function loadMediaAsset(db, id) { return db.from("media_assets").select(SELECT).eq("id", id).maybeSingle(); }
export function removeMediaUsage(db, entityType, entityId, fieldName) { return db.from("media_asset_usages").delete().eq("entity_type", entityType).eq("entity_id", entityId).eq("field_name", fieldName); }
export function upsertMediaUsage(db, payload) { return db.from("media_asset_usages").upsert(payload, { onConflict: "entity_type,entity_id,field_name" }); }
