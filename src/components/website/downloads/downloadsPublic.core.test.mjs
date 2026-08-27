import test from "node:test";
import assert from "node:assert/strict";
import { createPublicDownloadDto, formatDownloadFileSize, groupPublicDownloads, isCompletePublicDownload, isPublicDownloadUuid } from "./downloadsPublic.core.mjs";

const ID = "11111111-1111-4111-8111-111111111111";
const CATEGORY_ID = "22222222-2222-4222-8222-222222222222";
const ASSET_ID = "33333333-3333-4333-8333-333333333333";

const record = (overrides = {}) => ({
  id: ID, category_id: CATEGORY_ID, media_asset_id: ASSET_ID, title: "Mitgliedsantrag", description: "Formular", is_published: true, sort_order: 2,
  category: { id: CATEGORY_ID, name_de: "Mitgliedschaft", is_active: true, sort_order: 1 },
  asset: { id: ASSET_ID, storage_bucket: "media-library-private", storage_path: "download/file.pdf", media_kind: "document", mime_type: "application/pdf", file_size_bytes: 1468006, visibility: "admin", purpose: "download", is_archived: false },
  usage: { media_asset_id: ASSET_ID, entity_type: "download", entity_id: ID, field_name: "file" },
  ...overrides,
});

test("validates UUIDs and formats file sizes", () => {
  assert.equal(isPublicDownloadUuid(ID), true);
  assert.equal(isPublicDownloadUuid("invalid"), false);
  assert.equal(formatDownloadFileSize(0), "0 B");
  assert.equal(formatDownloadFileSize(1024), "1 KB");
  assert.equal(formatDownloadFileSize(1468006), "1,4 MB");
  assert.equal(formatDownloadFileSize(-1), null);
});

test("only a fully consistent published private PDF is public", () => {
  assert.equal(isCompletePublicDownload(record()), true);
  const invalid = [
    { is_published: false },
    { category: { ...record().category, is_active: false } },
    { asset: { ...record().asset, is_archived: true } },
    { asset: { ...record().asset, media_kind: "image" } },
    { asset: { ...record().asset, mime_type: "image/png" } },
    { asset: { ...record().asset, purpose: "document" } },
    { asset: { ...record().asset, storage_bucket: "media-library-public" } },
    { asset: { ...record().asset, visibility: "public" } },
    { usage: null },
    { usage: { ...record().usage, media_asset_id: "44444444-4444-4444-8444-444444444444" } },
    { usage: { ...record().usage, entity_id: "55555555-5555-4555-8555-555555555555" } },
  ];
  for (const value of invalid) assert.equal(isCompletePublicDownload(record(value)), false);
});

test("public DTO is minimal and never contains storage metadata", () => {
  const dto = createPublicDownloadDto(record());
  assert.deepEqual(Object.keys(dto), ["id", "title", "description", "fileSize", "href"]);
  assert.equal(JSON.stringify(dto).includes("storage_path"), false);
  assert.equal(createPublicDownloadDto(record({ is_published: false })), null);
});

test("groups active non-empty categories and sorts categories and downloads stably", () => {
  const secondId = "66666666-6666-4666-8666-666666666666";
  const otherCategoryId = "77777777-7777-4777-8777-777777777777";
  const items = [
    record({ id: secondId, title: "Zweiter", sort_order: 1, usage: { ...record().usage, entity_id: secondId } }),
    record(),
    record({ id: "88888888-8888-4888-8888-888888888888", category_id: otherCategoryId, category: { id: otherCategoryId, name_de: "Ablage", is_active: true, sort_order: 0 }, usage: { ...record().usage, entity_id: "88888888-8888-4888-8888-888888888888" } }),
    record({ id: "99999999-9999-4999-8999-999999999999", category: { ...record().category, is_active: false }, usage: { ...record().usage, entity_id: "99999999-9999-4999-8999-999999999999" } }),
  ];
  const groups = groupPublicDownloads(items);
  assert.deepEqual(groups.map((group) => group.name), ["Ablage", "Mitgliedschaft"]);
  assert.deepEqual(groups[1].downloads.map((item) => item.title), ["Zweiter", "Mitgliedsantrag"]);
  assert.equal(groups.some((group) => group.downloads.length === 0), false);
});

test("optional descriptions stay optional", () => {
  assert.equal(createPublicDownloadDto(record({ description: null })).description, null);
});
