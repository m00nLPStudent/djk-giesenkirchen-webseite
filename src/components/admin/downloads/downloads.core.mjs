const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const isDownloadUuid = (value) => UUID_PATTERN.test(String(value || ""));

export function normalizeDownloadInput(input = {}) {
  return {
    id: String(input.id || "").trim() || null,
    title: String(input.title || "").trim(),
    description: String(input.description || "").trim() || null,
    categoryId: String(input.categoryId || input.category_id || "").trim(),
    mediaAssetId: String(input.mediaAssetId || input.media_asset_id || "").trim(),
    sortOrder: Number(input.sortOrder ?? input.sort_order ?? 0),
    isPublished: input.isPublished === true || input.is_published === true || input.isPublished === "true",
  };
}

export function validateDownloadInput(input = {}) {
  const value = normalizeDownloadInput(input);
  const errors = {};
  if (!value.title || value.title.length > 200) errors.title = "Der Titel muss 1 bis 200 Zeichen enthalten.";
  if (value.description && value.description.length > 2000) errors.description = "Die Beschreibung darf höchstens 2.000 Zeichen enthalten.";
  if (!isDownloadUuid(value.categoryId)) errors.categoryId = "Bitte eine gültige Kategorie auswählen.";
  if (!isDownloadUuid(value.mediaAssetId)) errors.mediaAssetId = "Bitte eine geeignete PDF-Datei auswählen.";
  if (!Number.isInteger(value.sortOrder) || value.sortOrder < 0 || value.sortOrder > 1000000) errors.sortOrder = "Die Sortierung muss zwischen 0 und 1.000.000 liegen.";
  return { ok: Object.keys(errors).length === 0, value, errors };
}

export function isEligibleDownloadAsset(asset = {}) {
  return Boolean(asset.id && !asset.is_archived && asset.media_kind === "document" && asset.mime_type === "application/pdf" && asset.storage_bucket === "media-library-private" && ["admin", "restricted"].includes(asset.visibility) && asset.purpose === "download");
}

export function classifyDownloadPickerAsset(asset = {}) {
  if (!asset.id || asset.is_archived || asset.media_kind !== "document" || asset.mime_type !== "application/pdf") return { visible:false,selectable:false,reason:"Nicht geeignet" };
  const usageCount=Array.isArray(asset.media_asset_usages)?asset.media_asset_usages.length:0;
  if (isEligibleDownloadAsset(asset)) return { visible:true,selectable:true,reason:usageCount?`Download-Datei · ${usageCount} Verwendung${usageCount===1?"":"en"}`:"Direkt verwendbar · nicht verwendet",usageCount };
  if (asset.storage_bucket === "media-library-public" || asset.visibility === "public") return { visible:true,selectable:false,reason:"Öffentliche Datei – erneut privat als Download-PDF hochladen",usageCount };
  if (usageCount>0) return { visible:true,selectable:false,reason:`Bereits anderweitig verwendet (${usageCount})`,usageCount };
  if (asset.storage_bucket === "media-library-private" && ["admin","restricted"].includes(asset.visibility)) return { visible:true,selectable:false,reason:"Privates PDF – sichere Purpose-Übernahme noch nicht atomar verfügbar",usageCount };
  return { visible:true,selectable:false,reason:"Für private Downloads nicht geeignet",usageCount };
}

export function sortDownloads(items = []) {
  return [...items].sort((a, b) => (a.category_sort_order ?? 0) - (b.category_sort_order ?? 0) || (a.sort_order ?? 0) - (b.sort_order ?? 0) || String(a.title).localeCompare(String(b.title), "de") || String(a.id).localeCompare(String(b.id)));
}

export function canChangePublished(previous, next) {
  return Boolean(previous) && Boolean(previous.is_published) !== Boolean(next.isPublished);
}
