const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isPublicDownloadUuid = (value) => UUID_PATTERN.test(String(value || ""));

export function formatDownloadFileSize(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value < 0) return null;
  if (value < 1024) return `${Math.round(value)} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 }).format(value / (1024 * 1024))} MB`;
}

export function isCompletePublicDownload(record = {}) {
  const category = record.category;
  const asset = record.asset;
  const usage = record.usage;
  return Boolean(
    isPublicDownloadUuid(record.id) &&
      record.is_published === true &&
      category?.id === record.category_id &&
      category.is_active === true &&
      asset?.id === record.media_asset_id &&
      asset.is_archived === false &&
      asset.media_kind === "document" &&
      asset.mime_type === "application/pdf" &&
      asset.purpose === "download" &&
      asset.storage_bucket === "media-library-private" &&
      ["admin", "restricted"].includes(asset.visibility) &&
      usage?.entity_type === "download" &&
      usage.entity_id === record.id &&
      usage.field_name === "file" &&
      usage.media_asset_id === record.media_asset_id
  );
}

export function createPublicDownloadDto(record) {
  if (!isCompletePublicDownload(record)) return null;
  return {
    id: record.id,
    title: record.title,
    description: record.description || null,
    fileSize: formatDownloadFileSize(record.asset.file_size_bytes),
    href: `/downloads/${record.id}/file`,
  };
}

export function groupPublicDownloads(records = []) {
  const valid = records.filter(isCompletePublicDownload).sort((a, b) =>
    (a.category.sort_order ?? 0) - (b.category.sort_order ?? 0) ||
    String(a.category.name_de).localeCompare(String(b.category.name_de), "de") ||
    (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
    String(a.title).localeCompare(String(b.title), "de") ||
    String(a.id).localeCompare(String(b.id))
  );
  const groups = new Map();
  for (const record of valid) {
    if (!groups.has(record.category.id)) groups.set(record.category.id, { id: record.category.id, name: record.category.name_de, downloads: [] });
    groups.get(record.category.id).downloads.push(createPublicDownloadDto(record));
  }
  return [...groups.values()];
}
