import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const proposal = read("../../../../../docs/sql/b15-19f2-2-news-documents-legacy-nullability-proposal.sql");
const postcheck = read("../../../../../docs/sql/b15-19f2-2-news-documents-legacy-nullability-postcheck-readonly.sql");
const rollback = read("../../../../../docs/sql/b15-19f2-2-news-documents-legacy-nullability-rollback.sql");
const actions = read("../../../../app/admin/news/actions.js");

test("F2.2 relaxes only legacy path and URL without unverified data constraints", () => {
  assert.match(proposal, /ALTER COLUMN file_path DROP NOT NULL/);
  assert.match(proposal, /ALTER COLUMN file_url DROP NOT NULL/);
  for (const column of ["file_name", "mime_type", "file_size", "media_asset_id"]) assert.doesNotMatch(proposal, new RegExp(`ALTER COLUMN ${column}`));
  assert.doesNotMatch(proposal, /ADD CONSTRAINT|\bCHECK\s*\(/);
  assert.doesNotMatch(proposal, /\b(?:UPDATE|INSERT|DELETE)\b/i);
});

test("F2.2 postcheck inventories nullability sources assets and usages read-only", () => {
  for (const token of ["file_name","file_path","file_url","mime_type","file_size","media_asset_id","without_file_source","suspicious_fake_legacy_values","media_asset_usages"]) assert.match(postcheck, new RegExp(token));
  assert.doesNotMatch(postcheck, /\b(?:UPDATE|INSERT|DELETE|ALTER|DROP|CREATE|TRUNCATE)\b/i);
});

test("F2.2 rollback aborts before restoring legacy NOT NULL when central rows exist", () => {
  assert.match(rollback, /WHERE file_path IS NULL OR file_url IS NULL/);
  assert.match(rollback, /RAISE EXCEPTION/);
  assert.match(rollback, /ALTER COLUMN file_path SET NOT NULL/);
  assert.match(rollback, /ALTER COLUMN file_url SET NOT NULL/);
  assert.doesNotMatch(rollback, /\b(?:UPDATE|INSERT|DELETE|TRUNCATE)\b/i);
});

test("central create writes no fake legacy source and raw database errors stay server-side", () => {
  const insert = actions.match(/\.from\("news_documents"\)\.insert\((\{[^;]+?)\)\.select/s)?.[1] || "";
  assert.doesNotMatch(insert, /file_path|file_url|['"]central['"]|['"]media_asset['"]/);
  assert.match(actions, /logNewsDocumentError\("create", saved\.error\)/);
  assert.match(actions, /Das News-Dokument konnte nicht hinzugefügt werden/);
});
