import test from "node:test";
import assert from "node:assert/strict";
import { resolveTeamContactImage } from "./publicTeamContactImage.core.mjs";

test("contact image follows seasonal media, seasonal legacy, team media and team legacy", () => {
  const urls = new Map([["season", "season-media"], ["team", "team-media"]]);
  const input = { seasonMediaAssetId: "season", seasonLegacyUrl: "season-legacy", teamMediaAssetId: "team", teamLegacyUrl: "team-legacy" };
  assert.equal(resolveTeamContactImage(input, urls, "placeholder"), "season-media");
  assert.equal(resolveTeamContactImage({ ...input, seasonMediaAssetId: "private" }, urls, "placeholder"), "season-legacy");
  assert.equal(resolveTeamContactImage({ ...input, seasonMediaAssetId: null, seasonLegacyUrl: "", teamMediaAssetId: "team" }, urls, "placeholder"), "team-media");
  assert.equal(resolveTeamContactImage({ teamLegacyUrl: "team-legacy" }, new Map(), "placeholder"), "team-legacy");
  assert.equal(resolveTeamContactImage({}, new Map(), "placeholder"), "placeholder");
});
