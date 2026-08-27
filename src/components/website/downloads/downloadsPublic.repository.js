import "server-only";

const DOWNLOAD_FIELDS = "id,category_id,media_asset_id,title,description,is_published,sort_order";
const ASSET_FIELDS = "id,storage_bucket,storage_path,media_kind,mime_type,file_size_bytes,visibility,purpose,is_archived";

export function listPublishedDownloads(db) { return db.from("downloads").select(DOWNLOAD_FIELDS).eq("is_published", true); }
export function listActiveDownloadCategories(db) { return db.from("download_categories").select("id,name_de,is_active,sort_order").eq("is_active", true); }
export function listDownloadAssets(db, ids) { return db.from("media_assets").select(ASSET_FIELDS).in("id", ids); }
export function listDownloadUsages(db, ids) { return db.from("media_asset_usages").select("media_asset_id,entity_type,entity_id,field_name").eq("entity_type", "download").eq("field_name", "file").in("entity_id", ids); }
export function getPublishedDownload(db, id) { return db.from("downloads").select(DOWNLOAD_FIELDS).eq("id", id).eq("is_published", true).maybeSingle(); }
export function getActiveDownloadCategory(db, id) { return db.from("download_categories").select("id,name_de,is_active,sort_order").eq("id", id).eq("is_active", true).maybeSingle(); }
export function getDownloadAsset(db, id) { return db.from("media_assets").select(ASSET_FIELDS).eq("id", id).maybeSingle(); }
export function getDownloadUsage(db, downloadId, mediaAssetId) { return db.from("media_asset_usages").select("media_asset_id,entity_type,entity_id,field_name").eq("entity_type", "download").eq("entity_id", downloadId).eq("field_name", "file").eq("media_asset_id", mediaAssetId).maybeSingle(); }
