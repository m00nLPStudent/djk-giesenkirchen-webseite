import test from "node:test";
import assert from "node:assert/strict";
import { resolvePublicTeamImage } from "./publicTeamImage.core.mjs";

const mediaUrls = new Map([["public-b", "/media/b.jpg"], ["public-a", "/media/a.jpg"]]);

test("public central team media wins over empty seasonal and team legacy values", () => {
  for (const seasonLegacyUrl of [undefined, null, "", "   "]) {
    assert.equal(resolvePublicTeamImage({ mediaAssetId: "public-b", teamLegacyUrl: "/legacy/a.jpg", seasonLegacyUrl }, mediaUrls), "/media/b.jpg");
  }
});

test("a real seasonal legacy image keeps its existing public priority", () => {
  assert.equal(resolvePublicTeamImage({ mediaAssetId: "public-b", teamLegacyUrl: "/legacy/team.jpg", seasonLegacyUrl: " /legacy/season.jpg " }, mediaUrls), "/legacy/season.jpg");
});

test("missing or rejected public media falls back safely", () => {
  assert.equal(resolvePublicTeamImage({ mediaAssetId: "admin-private", teamLegacyUrl: "/legacy/team.jpg" }, mediaUrls), "/legacy/team.jpg");
  assert.equal(resolvePublicTeamImage({ mediaAssetId: "admin-private" }, mediaUrls), "");
});

test("replacement selects only the currently mapped public asset", () => {
  assert.equal(resolvePublicTeamImage({ mediaAssetId: "public-a" }, mediaUrls), "/media/a.jpg");
  assert.equal(resolvePublicTeamImage({ mediaAssetId: "public-b" }, mediaUrls), "/media/b.jpg");
});
