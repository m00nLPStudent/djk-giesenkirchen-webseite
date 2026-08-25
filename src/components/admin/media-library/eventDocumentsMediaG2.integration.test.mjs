import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const actions = read("../../../app/admin/events/actions.js");
const editor = read("../events/forms/EventEditorForm.js");
const manager = read("../events/components/EventDocumentsManager.js");
const legacyService = read("../events/services/events.service.js");
const publicDetail = read("../../../app/(website)/termine/[slug]/page.js");
const resolver = read("../events/services/eventMedia.service.js");
const purposes = read("./mediaPurpose.config.mjs");
const proposal = read("../../../../docs/sql/b15-19g2-event-documents-media-reference-proposal.sql");
const rollback = read("../../../../docs/sql/b15-19g2-event-documents-media-reference-rollback.sql");

test("event documents use server actions and the shared document picker", () => {
  assert.match(editor, /loadEventDocumentsAction/);
  assert.match(editor, /createEventDocumentAction/);
  assert.match(editor, /deleteEventDocumentAction/);
  assert.match(manager, /AdminMediaPickerDialog/);
  assert.match(manager, /mediaKind="document"/);
  assert.match(manager, /defaultPurpose="event"/);
  assert.doesNotMatch(legacyService, /uploadEventDocument|events-documents/);
});

test("upload, selection and removal preserve central assets and legacy compatibility", () => {
  assert.match(actions, /uploadMediaAsset/);
  assert.match(actions, /purpose: "event"/);
  assert.match(actions, /resolveEntityDocumentMedia/);
  assert.match(actions, /synchronizeMediaAssignment\("event_document"/);
  assert.match(actions, /if \(!current\.data\.media_asset_id && current\.data\.file_path\)/);
  assert.match(actions, /storage\.from\("events-documents"\)\.remove/);
  assert.match(purposes, /key: "event"[^\n]+mediaKind: "all"/);
});

test("public documents resolve only public active document assets and keep legacy fallback", () => {
  assert.match(resolver, /loadPublicMediaUrlMap\([^;]+"document"\)/s);
  assert.match(resolver, /item\.media_asset_id[\s\S]+media\.data\.get[\s\S]+item\.file_url/);
  assert.match(publicDetail, /resolvePublicEventDocuments/);
  assert.match(publicDetail, /href=\{document\.resolved_file_url\}/);
});

test("proposal extends G1 and F2 contracts defensively without backfill", () => {
  for (const target of ["news_document", "event", "event_document"]) assert.match(proposal, new RegExp(`'${target}'`));
  assert.match(proposal, /ALTER COLUMN file_path DROP NOT NULL/);
  assert.match(proposal, /ON DELETE SET NULL/);
  assert.match(proposal, /cleanup_event_document_media_usage/);
  assert.match(proposal, /TO service_role/);
  assert.doesNotMatch(proposal, /UPDATE public\.event_documents SET (file_path|file_url)|INSERT INTO public\.media_assets|storage\.objects/);
  assert.match(rollback, /rollback refused/);
  assert.doesNotMatch(rollback, /DELETE FROM public\.media_assets|storage\./);
});
