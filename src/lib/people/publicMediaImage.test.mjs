import test from "node:test";
import assert from "node:assert/strict";
import { resolveLoadedPublicMediaImage, resolvePublicMediaImage } from "./publicMediaImage.mjs";

const publicAsset = { media_kind: "image", visibility: "public", storage_bucket: "media-library-public", storage_path: "board_member/a.webp", is_archived: false };
const url = (bucket, path) => `https://storage.test/${bucket}/${path}`;

test("resolver uses a valid public media reference before the legacy URL", () => {
  assert.equal(resolvePublicMediaImage({ image_media_asset_id: "1", image_media_asset: publicAsset, image_url: "legacy" }, url, "placeholder"), "https://storage.test/media-library-public/board_member/a.webp");
});

test("resolver falls back from private, archived or absent assets to legacy and placeholder", () => {
  assert.equal(resolvePublicMediaImage({ image_media_asset_id: "1", image_media_asset: { ...publicAsset, visibility: "admin" }, image_url: "legacy" }, url, "placeholder"), "legacy");
  assert.equal(resolvePublicMediaImage({ image_media_asset_id: "1", image_media_asset: { ...publicAsset, is_archived: true } }, url, "placeholder"), "placeholder");
  assert.equal(resolvePublicMediaImage({}, url, "placeholder"), "placeholder");
});

test("batch-loaded public resolver keeps media, legacy, placeholder order", () => {
  const media = new Map([["1", "public-url"]]);
  assert.equal(resolveLoadedPublicMediaImage({ image_media_asset_id: "1", image_url: "legacy" }, media, "placeholder"), "public-url");
  assert.equal(resolveLoadedPublicMediaImage({ image_url: "legacy" }, media, "placeholder"), "legacy");
  assert.equal(resolveLoadedPublicMediaImage({}, media, "placeholder"), "placeholder");
});
