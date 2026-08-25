import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const schema = read("../../../../../docs/sql/b15-19a-media-library-schema-proposal.sql");
const coach = read("../../../../../docs/sql/b15-19b-coach-media-reference-proposal.sql");
const rpc = read("../../../../../docs/sql/b15-19f3-news-inline-media-proposal.sql");
const proposal = read("../../../../../docs/sql/b15-19f3-1-news-inline-multi-usage-proposal.sql");
const diagnostic = read("../../../../../docs/sql/b15-19f3-1-inline-usage-diagnostic-readonly.sql");
const postcheck = read("../../../../../docs/sql/b15-19f3-1-news-inline-multi-usage-postcheck-readonly.sql");
const rollback = read("../../../../../docs/sql/b15-19f3-1-news-inline-multi-usage-rollback.sql");

test("the later global slot index is the multi-inline collision", () => {
  assert.match(schema, /UNIQUE \(media_asset_id, entity_type, entity_id, field_name\)/);
  assert.match(coach, /CREATE UNIQUE INDEX media_asset_usages_one_field_per_entity\s+ON public\.media_asset_usages\s*\(entity_type, entity_id, field_name\)/);
  assert.match(rpc, /ON CONFLICT \(media_asset_id,entity_type,entity_id,field_name\) DO NOTHING/);
});

test("F3.1 permits only news content to hold several distinct assets", () => {
  assert.match(proposal, /DROP INDEX IF EXISTS public\.media_asset_usages_one_field_per_entity/);
  assert.match(proposal, /CREATE UNIQUE INDEX media_asset_usages_one_field_per_entity/);
  assert.match(proposal, /WHERE NOT \(entity_type='news' AND field_name='content'\)/);
  assert.doesNotMatch(proposal, /DROP CONSTRAINT|ALTER TABLE|DELETE FROM|UPDATE public|INSERT INTO/i);
  assert.match(proposal, /BEGIN;[\s\S]*COMMIT;/);
});

test("diagnostic and postcheck are read-only and cover duplicates", () => {
  for (const sql of [diagnostic, postcheck]) {
    assert.match(sql, /media_asset_usages/);
    assert.match(sql, /count\(\*\)>1/);
    assert.doesNotMatch(sql, /\b(?:INSERT|UPDATE|DELETE|ALTER|DROP|CREATE|TRUNCATE)\b/i);
  }
});

test("rollback never discards usages and refuses lossy restoration", () => {
  assert.match(rollback, /HAVING count\(\*\)>1/);
  assert.match(rollback, /RAISE EXCEPTION/);
  assert.match(rollback, /ON public\.media_asset_usages\(entity_type,entity_id,field_name\)/);
  assert.doesNotMatch(rollback, /DELETE FROM public\.media_asset_usages/i);
});
