import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [proposal, postcheck, rollback] = await Promise.all([
  read("../../../../docs/sql/b15-19e1-team-image-media-reference-proposal.sql"),
  read("../../../../docs/sql/b15-19e1-team-image-media-reference-postcheck-readonly.sql"),
  read("../../../../docs/sql/b15-19e1-team-image-media-reference-rollback.sql"),
]);

test("proposal is additive, nullable and contains no migration or media deletion", () => {
  assert.match(proposal, /ADD COLUMN IF NOT EXISTS team_image_media_asset_id uuid NULL/);
  assert.match(proposal, /REFERENCES public\.media_assets\(id\) ON DELETE SET NULL/);
  assert.match(proposal, /teams_team_image_media_asset_idx/);
  assert.doesNotMatch(proposal, /UPDATE public\.team_seasons|ALTER TABLE public\.team_seasons|contact_image_url|DELETE FROM public\.media_assets|storage\./);
});

test("RPC adds exactly team to the D2 target set and remains service-role only", () => {
  assert.match(proposal, /'coach', 'player', 'board_member', 'club_contact', 'team'/);
  assert.match(proposal, /UPDATE public\.teams SET team_image_media_asset_id/);
  assert.match(proposal, /entity_type = p_entity_type[\s\S]*field_name = p_field_name/);
  assert.match(proposal, /REVOKE ALL[\s\S]*PUBLIC, anon, authenticated/);
  assert.match(proposal, /GRANT EXECUTE[\s\S]*service_role/);
  assert.doesNotMatch(proposal, /v_asset\.purpose|UPDATE public\.media_assets/);
});

test("postcheck is read-only and covers schema, RPC, invalid refs and usage integrity", () => {
  assert.doesNotMatch(postcheck, /\b(INSERT|UPDATE|DELETE|ALTER|DROP|CREATE)\b/);
  for (const marker of ["team_image_media_asset_id", "teams_team_image_media_asset_idx", "synchronize_media_assignment", "invalid_team_media_references", "dangling_team_usages", "team_references_without_matching_usage"]) assert.match(postcheck, new RegExp(marker));
});

test("rollback removes only E1 state and restores the exact D2 target scope", () => {
  assert.match(rollback, /DELETE FROM public\.media_asset_usages[\s\S]*entity_type = 'team'/);
  assert.match(rollback, /DROP COLUMN IF EXISTS team_image_media_asset_id/);
  assert.match(rollback, /'coach', 'player', 'board_member', 'club_contact'/);
  assert.doesNotMatch(rollback, /DROP TABLE|DELETE FROM public\.media_assets|ALTER TABLE public\.team_seasons|contact_image_url|storage\./);
});
