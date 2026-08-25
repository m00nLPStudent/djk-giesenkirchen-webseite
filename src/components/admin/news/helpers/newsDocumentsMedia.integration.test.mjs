import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const actions = read("../../../../app/admin/news/actions.js");
const manager = read("../components/NewsDocumentsManager.js");
const publicPage = read("../../../../app/(website)/news/[slug]/page.js");
const proposal = read("../../../../../docs/sql/b15-19f2-news-documents-media-reference-proposal.sql");
const postcheck = read("../../../../../docs/sql/b15-19f2-news-documents-media-reference-postcheck-readonly.sql");
const rollback = read("../../../../../docs/sql/b15-19f2-news-documents-media-reference-rollback.sql");

test("news documents use central PDF upload and document-only picker", () => {
  assert.match(actions, /file\.type !== "application\/pdf"/);
  assert.match(actions, /uploadMediaAsset\(file/);
  assert.match(actions, /kind: "document"/);
  assert.match(manager, /mediaKind="document"/);
});

test("each document has its own file usage and server-authorized mutations", () => {
  assert.match(actions, /synchronizeMediaAssignment\("news_document", saved\.data\.id, asset\.id, "file"\)/);
  assert.match(actions, /requiredPermission: "news\.edit"/);
  assert.match(actions, /const allowed = \["display_name_de", "description_de", "sort_order", "is_public"\]/);
});

test("news document metadata is German-only without clearing legacy English values", () => {
  assert.doesNotMatch(manager, /display_name_en|description_en|Anzeigename EN|Beschreibung EN|Englisch/);
  assert.match(manager, /display_name_de/);
  assert.match(manager, /description_de/);
  assert.doesNotMatch(actions.match(/export async function updateNewsDocumentAction[\s\S]*?\n}/)?.[0] || "", /display_name_en|description_en/);
  assert.doesNotMatch(actions.match(/\.from\("news_documents"\)\.insert\((\{[^;]+?)\)\.select/s)?.[1] || "", /display_name_en|description_en/);
});

test("public documents resolve public assets in a batch and legacy only without a media reference", () => {
  assert.match(publicPage, /resolvePublicNewsDocuments/);
  const service = read("../services/newsMedia.service.js");
  assert.match(service, /loadPublicMediaUrlMap\(rows\.map\(\(item\) => item\.media_asset_id\), "document"\)/);
  assert.match(service, /item\.media_asset_id \? media\.data\.get\(item\.media_asset_id\) \|\| null : item\.file_url/);
});

test("F2 SQL is additive, service-role-only and cleans cascade-deleted usages", () => {
  assert.match(proposal, /ADD COLUMN IF NOT EXISTS media_asset_id uuid NULL/);
  assert.match(proposal, /ON DELETE SET NULL/);
  assert.match(proposal, /p_entity_type = 'news_document'/);
  assert.match(proposal, /AFTER DELETE ON public\.news_documents/);
  assert.match(proposal, /GRANT EXECUTE[\s\S]*TO service_role/);
  assert.doesNotMatch(proposal, /INSERT INTO public\.media_assets/);
});

test("F2 proposal has complete transaction and PLpgSQL delimiters", () => {
  assert.match(proposal, /^--[^\n]*\nBEGIN;/);
  assert.match(proposal, /COMMIT;\s*$/);
  for (const tag of ["$fk$", "$usage_check$", "$fn$", "$cleanup$"]) {
    assert.equal(proposal.split(tag).length - 1, 2, `${tag} must be paired`);
  }
  assert.doesNotMatch(proposal, /END\s+\$(?:fk|usage_check|fn|cleanup)\$/);
  assert.match(proposal, /END;\s*\$fn\$;/);
  assert.match(proposal, /END;\s*\$cleanup\$;/);
});

test("assignment allowlist preserves F1 targets and adds only news_document file", () => {
  for (const entity of ["coach", "player", "board_member", "club_contact", "team", "team_season", "news"]) assert.match(proposal, new RegExp(`'${entity}'`));
  assert.match(proposal, /p_field_name = 'file' AND p_entity_type = 'news_document'/);
  assert.match(proposal, /WHEN p_field_name = 'file' THEN 'document'/);
  assert.match(proposal, /ELSE 'image'/);
  assert.match(proposal, /UPDATE public\.news_documents SET media_asset_id = p_media_asset_id/);
});

test("F2 SQL grants, cleanup and rollback retain their narrow contracts", () => {
  assert.match(proposal, /REVOKE ALL[\s\S]*FROM PUBLIC, anon, authenticated/);
  assert.match(proposal, /GRANT EXECUTE[\s\S]*TO service_role/);
  assert.match(proposal, /AFTER DELETE ON public\.news_documents/);
  assert.doesNotMatch(proposal, /DELETE FROM public\.media_assets|storage\./i);
  assert.doesNotMatch(proposal, /INSERT INTO public\.media_assets/);
  assert.match(rollback, /END;\s*\$fn\$;/);
  assert.match(rollback, /p_entity_type IN \('coach','player','board_member','club_contact','team','team_season','news'\)/);
  assert.doesNotMatch(rollback, /DROP COLUMN IF EXISTS image_media_asset_id|DELETE FROM public\.media_assets|storage\./i);
});

test("postcheck covers schema RPC grants integrity public leaks and inventory read-only", () => {
  for (const token of ["data_type", "is_nullable", "pg_get_constraintdef", "pg_get_functiondef", "has_function_privilege", "is_archived", "HAVING count(*)>1", "possible_asset_id", "visibility<>'public'"]) assert.match(postcheck, new RegExp(token.replace(/[()*+?.^$|]/g, "\\$&")));
  assert.doesNotMatch(postcheck, /\b(?:INSERT|UPDATE|DELETE|ALTER|DROP|CREATE|TRUNCATE)\b/i);
});
