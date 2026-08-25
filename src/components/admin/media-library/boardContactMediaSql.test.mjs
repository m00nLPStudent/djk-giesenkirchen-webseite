import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [proposal, postcheck, rollback, b15c] = await Promise.all([
  read("../../../../docs/sql/b15-19d-board-contact-media-reference-proposal.sql"),
  read("../../../../docs/sql/b15-19d-board-contact-media-reference-postcheck-readonly.sql"),
  read("../../../../docs/sql/b15-19d-board-contact-media-reference-rollback.sql"),
  read("../../../../docs/sql/b15-19c-player-media-reference-proposal.sql"),
]);

const occurrences = (source, pattern) => [...source.matchAll(pattern)].length;
const normalizeSql = (source) => source.replace(/--.*$/gm, " ").replace(/\s+/g, " ").trim();
const withoutComments = (source) => source.replace(/--.*$/gm, "");
const rpcBlock = (source) => source.match(/CREATE OR REPLACE FUNCTION public\.synchronize_media_assignment\([\s\S]*?\$\$;/)?.[0];

test("proposal transaction, function body and dollar quotes are fully closed", () => {
  assert.match(proposal, /^BEGIN;[\s\S]*COMMIT;\s*$/m);
  assert.equal(occurrences(proposal, /\$function\$/g), 2);
  assert.equal(occurrences(proposal, /\$b15_19d_fk\$/g), 2);
  assert.match(proposal, /RETURN p_media_asset_id;\s*END;\s*\$function\$;/);
  assert.equal(occurrences(proposal, /^\s*IF\b/gm), occurrences(proposal, /^\s*END IF;/gm));
  assert.match(proposal, /v_expected_purpose := CASE p_entity_type[\s\S]*ELSE NULL[\s\S]*END;/);
  assert.doesNotMatch(proposal, /END CASE/);
});

test("RPC allowlists exactly four entities and only the image field", () => {
  assert.match(proposal, /NOT IN \('coach', 'player', 'board_member', 'club_contact'\)/);
  assert.match(proposal, /p_field_name <> 'image'/);
  assert.match(proposal, /RAISE EXCEPTION 'Unsupported media assignment target'/);
  for (const table of ["coaches", "players", "board_members", "club_contacts"]) {
    assert.match(proposal, new RegExp(`UPDATE public\\.${table}`));
  }
});

test("purpose mapping and media validation preserve every entity contract", () => {
  for (const [entity, purpose] of [["coach", "coach"], ["player", "player"], ["board_member", "board"], ["club_contact", "cms"]]) {
    assert.match(proposal, new RegExp(`WHEN '${entity}' THEN '${purpose}'`));
  }
  assert.match(proposal, /v_asset\.is_archived/);
  assert.match(proposal, /v_asset\.media_kind <> 'image'/);
  assert.match(proposal, /v_asset\.purpose <> v_expected_purpose/);
});

test("schema additions are nullable, idempotent and keep legacy data untouched", () => {
  assert.equal(occurrences(proposal, /ADD COLUMN IF NOT EXISTS image_media_asset_id uuid NULL/g), 2);
  assert.equal(occurrences(proposal, /REFERENCES public\.media_assets\(id\)/g), 2);
  assert.equal(occurrences(proposal, /ON DELETE SET NULL/g), 2);
  assert.equal(occurrences(proposal, /CREATE INDEX IF NOT EXISTS/g), 2);
  const schemaPrefix = proposal.split("CREATE OR REPLACE FUNCTION")[0];
  assert.doesNotMatch(schemaPrefix, /^\s*(UPDATE|INSERT|DELETE)\b/im);
  assert.doesNotMatch(proposal, /DELETE FROM public\.media_assets|DROP TABLE|storage\./i);
});

test("RPC execution remains service-role only", () => {
  assert.match(proposal, /REVOKE ALL ON FUNCTION[\s\S]*FROM PUBLIC, anon, authenticated;/);
  assert.match(proposal, /GRANT EXECUTE ON FUNCTION[\s\S]*TO service_role;/);
});

test("postcheck covers schema, RPC, grants and reference-usage integrity read-only", () => {
  for (const token of ["information_schema.columns", "pg_constraint", "pg_indexes", "pg_get_functiondef", "routine_privileges", "board_member", "club_contact", "coach", "player", "purpose <> 'board'", "purpose <> 'cms'"]) assert.match(postcheck, new RegExp(token));
  assert.doesNotMatch(withoutComments(postcheck), /^\s*(ALTER|CREATE|DROP|DELETE|INSERT|UPDATE|GRANT|REVOKE)\b/im);
});

test("rollback removes only B15.19D schema and restores the B15.19C RPC", () => {
  assert.equal(normalizeSql(rpcBlock(rollback)), normalizeSql(rpcBlock(b15c)));
  const outsideRpc = rollback.replace(rpcBlock(rollback), "");
  assert.doesNotMatch(withoutComments(outsideRpc), /DROP TABLE|DELETE FROM public\.media_assets|DELETE FROM public\.media_asset_usages|storage\./i);
  assert.match(rollback, /NOT IN \('coach', 'player'\)/);
  assert.doesNotMatch(rpcBlock(rollback), /board_member|club_contact/);
});
