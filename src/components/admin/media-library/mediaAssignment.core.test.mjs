import test from "node:test";
import assert from "node:assert/strict";
import { buildMediaAssignmentPayload } from "./mediaAssignment.core.mjs";

test("buildMediaAssignmentPayload supports the shared coach and player image path", () => {
  assert.deepEqual(buildMediaAssignmentPayload("player", "player-1", "asset-1").payload, { p_entity_type: "player", p_entity_id: "player-1", p_media_asset_id: "asset-1", p_field_name: "image" });
  assert.equal(buildMediaAssignmentPayload("coach", "coach-1", null).payload.p_media_asset_id, null);
});

test("buildMediaAssignmentPayload supports events and rejects invalid fields", () => {
  assert.equal(buildMediaAssignmentPayload("event", "event-1", "asset-1").ok, true);
  assert.equal(buildMediaAssignmentPayload("player", "player-1", "asset-1", "document").ok, false);
});

test("buildMediaAssignmentPayload supports an independent team season image usage", () => {
  assert.deepEqual(buildMediaAssignmentPayload("team_season", "season-1", "asset-1"), {
    ok: true,
    payload: { p_entity_type: "team_season", p_entity_id: "season-1", p_media_asset_id: "asset-1", p_field_name: "image" },
  });
});

test("contact image is restricted to team and team season targets", () => {
  assert.equal(buildMediaAssignmentPayload("team", "team-1", "asset-1", "contact_image").ok, true);
  assert.equal(buildMediaAssignmentPayload("team_season", "season-1", null, "contact_image").ok, true);
  assert.equal(buildMediaAssignmentPayload("coach", "coach-1", "asset-1", "contact_image").ok, false);
});

test("news title images use the shared image assignment field", () => {
  assert.equal(buildMediaAssignmentPayload("news", "news-1", "asset-1").ok, true);
  assert.equal(buildMediaAssignmentPayload("news", "news-1", "asset-1", "contact_image").ok, false);
});

test("news and event documents share the central file assignment contract", () => {
  assert.equal(buildMediaAssignmentPayload("news_document", "news-doc-1", "asset-1", "file").ok, true);
  assert.equal(buildMediaAssignmentPayload("event_document", "event-doc-1", "asset-1", "file").ok, true);
  assert.equal(buildMediaAssignmentPayload("event_document", "event-doc-1", "asset-1", "image").ok, false);
});

test("downloads use the central file assignment contract", () => {
  assert.deepEqual(buildMediaAssignmentPayload("download", "download-1", "asset-1", "file"), {
    ok: true,
    payload: { p_entity_type: "download", p_entity_id: "download-1", p_media_asset_id: "asset-1", p_field_name: "file" },
  });
  assert.equal(buildMediaAssignmentPayload("download", "download-1", "asset-1", "image").ok, false);
});

test("sponsor logos use the shared image assignment contract", () => {
  const result = buildMediaAssignmentPayload("sponsor", "sponsor-1", "asset-1", "image");
  assert.equal(result.ok, true);
  assert.deepEqual(result.payload, { p_entity_type: "sponsor", p_entity_id: "sponsor-1", p_media_asset_id: "asset-1", p_field_name: "image" });
});

test("dashboard avatars use the dedicated admin profile field", () => {
  assert.deepEqual(buildMediaAssignmentPayload("admin_profile", "profile-1", "asset-1", "avatar"), {
    ok: true,
    payload: { p_entity_type: "admin_profile", p_entity_id: "profile-1", p_media_asset_id: "asset-1", p_field_name: "avatar" },
  });
  assert.equal(buildMediaAssignmentPayload("admin_profile", "profile-1", "asset-1", "image").ok, false);
});
