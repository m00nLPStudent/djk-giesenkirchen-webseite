import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (name) => readFile(new URL(`../../../../docs/sql/${name}`, import.meta.url), "utf8");
const [proposal, postcheck, rollback] = await Promise.all([
  read("b15-19e2-season-team-image-media-reference-proposal.sql"),
  read("b15-19e2-season-team-image-media-reference-postcheck-readonly.sql"),
  read("b15-19e2-season-team-image-media-reference-rollback.sql"),
]);

test("proposal adds nullable season media reference and hardened assignment target without backfill", () => {
  assert.match(proposal, /team_seasons[\s\S]*team_image_media_asset_id uuid NULL/);
  assert.match(proposal, /REFERENCES public\.media_assets\(id\)[\s\S]*ON DELETE SET NULL/);
  assert.match(proposal, /team_seasons_team_image_media_asset_idx/);
  assert.match(proposal, /'team_season'/);
  assert.match(proposal, /UPDATE public\.team_seasons SET team_image_media_asset_id/);
  assert.match(proposal, /REVOKE ALL[\s\S]*PUBLIC, anon, authenticated/);
  assert.match(proposal, /GRANT EXECUTE[\s\S]*service_role/);
  assert.doesNotMatch(proposal, /UPDATE public\.team_seasons\s+SET team_image_url/i);
});

test("postcheck is read only and rollback restores only E1 scope", () => {
  assert.doesNotMatch(postcheck, /\b(INSERT|UPDATE|DELETE|ALTER|DROP|CREATE)\b/i);
  for (const marker of ["invalid_or_unsafe_season_media_references", "dangling_team_season_usages", "references_without_matching_usage", "usages_without_matching_reference"]) assert.match(postcheck, new RegExp(marker));
  assert.match(rollback, /DELETE FROM public\.media_asset_usages[\s\S]*entity_type = 'team_season'/);
  assert.match(rollback, /DROP COLUMN IF EXISTS team_image_media_asset_id/);
  assert.doesNotMatch(rollback, /DELETE FROM public\.media_assets|storage\./);
  assert.doesNotMatch(rollback, /ALTER TABLE public\.teams DROP COLUMN/);
});
