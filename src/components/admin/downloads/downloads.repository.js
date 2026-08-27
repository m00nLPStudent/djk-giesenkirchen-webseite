import "server-only";

const DOWNLOAD_SELECT = "id,category_id,media_asset_id,title,description,is_published,sort_order,published_at,created_by,updated_by,created_at,updated_at,download_categories(id,name_de,slug,is_active,sort_order),media_assets(id,storage_bucket,storage_path,original_filename,display_name,media_kind,mime_type,file_extension,file_size_bytes,visibility,purpose,is_archived)";

export function listDownloads(db) { return db.from("downloads").select(DOWNLOAD_SELECT); }
export function getDownload(db, id) { return db.from("downloads").select(DOWNLOAD_SELECT).eq("id", id).maybeSingle(); }
export function listDownloadCategories(db, { activeOnly = false } = {}) { let query=db.from("download_categories").select("id,name_de,slug,is_active,sort_order").order("sort_order").order("name_de"); if(activeOnly) query=query.eq("is_active",true); return query; }
export function getDownloadCategory(db, id) { return db.from("download_categories").select("id,is_active").eq("id",id).maybeSingle(); }
export function getMediaAsset(db, id) { return db.from("media_assets").select("id,storage_bucket,storage_path,original_filename,display_name,media_kind,mime_type,file_extension,file_size_bytes,visibility,purpose,is_archived").eq("id",id).maybeSingle(); }
export function insertDownload(db, payload) { return db.from("downloads").insert(payload).select(DOWNLOAD_SELECT).single(); }
export function updateDownload(db, id, payload) { return db.from("downloads").update(payload).eq("id",id).select(DOWNLOAD_SELECT).maybeSingle(); }
export function deleteDownload(db, id) { return db.from("downloads").delete().eq("id",id).select("id").maybeSingle(); }
