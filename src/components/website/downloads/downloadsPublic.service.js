import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import { createPrivateMediaSignedUrl } from "@/components/admin/media-library/media.service";
import { groupPublicDownloads, isCompletePublicDownload, isPublicDownloadUuid } from "./downloadsPublic.core.mjs";
import * as repository from "./downloadsPublic.repository";

const indexBy = (items = []) => new Map(items.map((item) => [item.id, item]));

export async function loadPublicDownloadGroups() {
  const db = createSupabaseAdminClient();
  if (!db) return { groups: [], error: true };
  const [downloads, categories] = await Promise.all([repository.listPublishedDownloads(db), repository.listActiveDownloadCategories(db)]);
  if (downloads.error || categories.error) return { groups: [], error: true };
  const rows = downloads.data || [];
  if (!rows.length) return { groups: [], error: false };
  const assetIds = [...new Set(rows.map((item) => item.media_asset_id).filter(Boolean))];
  const downloadIds = rows.map((item) => item.id);
  const [assets, usages] = await Promise.all([repository.listDownloadAssets(db, assetIds), repository.listDownloadUsages(db, downloadIds)]);
  if (assets.error || usages.error) return { groups: [], error: true };
  const categoryById = indexBy(categories.data);
  const assetById = indexBy(assets.data);
  const usageByDownloadId = new Map((usages.data || []).map((item) => [item.entity_id, item]));
  return { groups: groupPublicDownloads(rows.map((item) => ({ ...item, category: categoryById.get(item.category_id), asset: assetById.get(item.media_asset_id), usage: usageByDownloadId.get(item.id) }))), error: false };
}

export async function resolvePublicDownloadFile(id) {
  if (!isPublicDownloadUuid(id)) return { status: "not-found" };
  const db = createSupabaseAdminClient();
  if (!db) return { status: "error" };
  const download = await repository.getPublishedDownload(db, id);
  if (download.error || !download.data) return { status: "not-found" };
  const [category, asset, usage] = await Promise.all([
    repository.getActiveDownloadCategory(db, download.data.category_id),
    repository.getDownloadAsset(db, download.data.media_asset_id),
    repository.getDownloadUsage(db, download.data.id, download.data.media_asset_id),
  ]);
  if (category.error || asset.error || usage.error) return { status: "not-found" };
  const record = { ...download.data, category: category.data, asset: asset.data, usage: usage.data };
  if (!isCompletePublicDownload(record)) return { status: "not-found" };
  const signed = await createPrivateMediaSignedUrl(record.asset.storage_path, 120);
  if (signed.error || !signed.data) return { status: "error" };
  return { status: "ok", url: signed.data };
}
