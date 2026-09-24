import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const actions = read("../../../app/admin/events/actions.js");
const editPage = read("../../../app/admin/events/edit/[id]/page.js");
const newPage = read("../../../app/admin/events/new/page.js");
const eventDeleteButton = read("./components/EventDeleteButton.js");
const removeButton = read("../delete/AdminRemoveButton.js");
const foreignKeys = read("../../../../docs/datenbank_docu/b13-04-foreign-keys.csv");
const eventMediaSql = read("../../../../docs/sql/b15-19g1-event-image-media-reference-proposal.sql");
const eventDocumentMediaSql = read("../../../../docs/sql/b15-19g2-event-documents-media-reference-proposal.sql");

const deleteAction = actions.slice(
  actions.indexOf("export async function deleteEventAction"),
  actions.indexOf("async function buildUniqueSlug"),
);

test("users with events.delete receive the delete control on existing events", () => {
  assert.match(editPage, /<Can permission="events\.delete" uiOnly>/);
  assert.match(editPage, /<EventDeleteButton eventId=\{event\.id\}/);
});

test("the permission guard hides the control without events.delete", () => {
  assert.match(editPage, /<Can permission="events\.delete" uiOnly>[\s\S]*?<AdminDangerZone/);
  assert.doesNotMatch(editPage, /fallback=\{/);
});

test("the server action rejects direct deletion without events.delete before database access", () => {
  assert.match(deleteAction, /requiredPermission: "events\.delete"/);
  assert.match(deleteAction, /if \(!permission\.ok\) return eventActionError/);
  assert.ok(deleteAction.indexOf("if (!permission.ok)") < deleteAction.indexOf("createSupabaseAdminClient()"));
  assert.ok(deleteAction.indexOf("if (!permission.ok)") < deleteAction.indexOf('.from("events").delete()'));
});

test("existing event deletion uses the shared confirmation dialog", () => {
  assert.match(eventDeleteButton, /AdminRemoveButton/);
  assert.match(eventDeleteButton, /confirmationTitle="Termin wirklich löschen\?"/);
  assert.match(eventDeleteButton, /Diese Aktion kann nicht rückgängig gemacht werden/);
});

test("cancelling closes the dialog without invoking the delete action", () => {
  assert.match(removeButton, /onClick=\{\(\) => setOpen\(false\)\}/);
  assert.match(removeButton, /Abbrechen/);
  assert.doesNotMatch(eventDeleteButton, /confirm\(/);
});

test("confirming invokes exactly the intended event delete action", () => {
  assert.match(eventDeleteButton, /action=\{\(\) => deleteEventAction\(eventId\)\}/);
  assert.match(eventDeleteButton, /confirmLabel="Termin löschen"/);
  assert.match(removeButton, /onClick=\{run\}/);
});

test("new unsaved events never render a delete control", () => {
  assert.doesNotMatch(newPage, /EventDeleteButton|events\.delete|Termin löschen/);
});

test("successful deletion returns to the overview and revalidates admin and public event routes", () => {
  assert.match(eventDeleteButton, /successHref="\/admin\/events"/);
  assert.match(removeButton, /router\.replace\(successHref\)/);
  assert.match(deleteAction, /revalidatePath\("\/admin\/events"\)/);
  assert.match(deleteAction, /await revalidatePublicContentAction\("events"\)/);
});

test("the documented database contract cascades documents and cleans only media usages", () => {
  assert.match(foreignKeys, /event_documents,event_id,event_documents_event_id_fkey,public,events,id,NO ACTION,CASCADE/);
  assert.match(eventMediaSql, /event_cleanup_media_usage AFTER DELETE ON public\.events/);
  assert.match(eventDocumentMediaSql, /event_document_cleanup_media_usage AFTER DELETE ON public\.event_documents/);
  assert.doesNotMatch(deleteAction, /storage\.|media_assets/);
});
