import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const basicTab = read("./forms/tabs/EventBasicTab.js");
const initialState = read("./forms/eventEditor.initialState.js");
const payload = read("./forms/eventEditor.payload.js");
const detail = read("./components/EventDetailSummary.js");

test("event editor exposes German content fields only", () => {
  for (const label of ["Titel Deutsch", "Teaser Deutsch", "Beschreibung Deutsch"]) assert.ok(basicTab.includes(label));
  assert.doesNotMatch(basicTab, /Englisch|English|title_en|teaser_en|description_en/);
});

test("form state and save payload contain no English content keys", () => {
  for (const source of [initialState, payload]) assert.doesNotMatch(source, /title_en|teaser_en|description_en/);
});

test("detail summary uses no English event content", () => {
  assert.doesNotMatch(detail, /title_en|teaser_en|description_en|display_name_en/);
});
