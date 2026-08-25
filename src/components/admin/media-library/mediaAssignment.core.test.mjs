import test from "node:test";
import assert from "node:assert/strict";
import { buildMediaAssignmentPayload } from "./mediaAssignment.core.mjs";

test("buildMediaAssignmentPayload supports the shared coach and player image path", () => {
  assert.deepEqual(buildMediaAssignmentPayload("player", "player-1", "asset-1").payload, { p_entity_type: "player", p_entity_id: "player-1", p_media_asset_id: "asset-1", p_field_name: "image" });
  assert.equal(buildMediaAssignmentPayload("coach", "coach-1", null).payload.p_media_asset_id, null);
});

test("buildMediaAssignmentPayload rejects unrelated modules and fields", () => {
  assert.equal(buildMediaAssignmentPayload("news", "news-1", "asset-1").ok, false);
  assert.equal(buildMediaAssignmentPayload("player", "player-1", "asset-1", "document").ok, false);
});

test("buildMediaAssignmentPayload supports an independent team season image usage", () => {
  assert.deepEqual(buildMediaAssignmentPayload("team_season", "season-1", "asset-1"), {
    ok: true,
    payload: { p_entity_type: "team_season", p_entity_id: "season-1", p_media_asset_id: "asset-1", p_field_name: "image" },
  });
});
