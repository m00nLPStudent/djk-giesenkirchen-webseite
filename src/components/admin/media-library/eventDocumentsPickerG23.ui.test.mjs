import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const editor = read("../events/forms/EventEditorForm.js");
const tab = read("../events/forms/tabs/EventDocumentsTab.js");
const manager = read("../events/components/EventDocumentsManager.js");
const dialog = read("./AdminMediaPickerDialog.js");
const actions = read("../../../app/admin/events/actions.js");

test("saved event id reaches the document manager and enables its picker trigger", () => {
  assert.match(editor, /<EventDocumentsTab[\s\S]*eventId=\{event\?\.id \|\| null\}/);
  assert.match(tab, /eventId=\{eventId\}/);
  assert.match(manager, /disabled=\{!eventId\}/);
  assert.match(manager, /onClick=\{\(\) => setPickerOpen\(true\)\}/);
  assert.match(manager, /<AdminButton type="button"/);
});

test("dialog open and close state is wired to the shared media picker", () => {
  assert.match(manager, /useState\(false\)/);
  assert.match(manager, /open=\{pickerOpen\}/);
  assert.match(manager, /onClose=\{\(\) => setPickerOpen\(false\)\}/);
  assert.match(dialog, /dialog\.showModal\(\)/);
  assert.match(dialog, /onSelect\(response\.item\)/);
  assert.match(dialog, /onSelect\(item\)/);
});

test("document picker retains upload, library, document kind and cross-purpose behavior", () => {
  assert.match(manager, /mediaKind="document"/);
  assert.match(manager, /defaultPurpose="event"/);
  assert.match(manager, /loadAction=\{loadMediaAction\}/);
  assert.match(manager, /uploadAction=\{uploadMediaAction\}/);
  assert.match(dialog, /getPickerPurposeOptions\(mediaKind\)/);
  assert.match(actions, /uploadMediaAsset/);
  assert.match(actions, /createEventDocumentAction/);
});

test("new events show the existing save-first state without fake document staging", () => {
  assert.match(tab, /!isEdit/);
  assert.match(tab, /Speichere den Termin zuerst/);
  assert.doesNotMatch(editor, /temporary|draft.*document|staged/i);
});
