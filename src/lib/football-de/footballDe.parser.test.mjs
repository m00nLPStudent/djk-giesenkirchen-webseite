import assert from "node:assert/strict";
import test from "node:test";
import { validateFootballDeWidgetCode } from "./footballDe.parser.js";

const id = "f20c4b49-78aa-4a7c-8dbe-d2f939d8511b";
test("validates the complete widget code and expected type", () => {
  assert.equal(validateFootballDeWidgetCode(`<div class="fussballde_widget" data-id="${id}" data-type="team-matches"></div>`, "matches").data.widgetId, id);
  assert.equal(validateFootballDeWidgetCode(`<div data-type="table" data-id="${id}"></div>`, "table").data.widgetType, "table");
});
test("rejects empty, malformed and mismatched widget code", () => {
  assert.equal(validateFootballDeWidgetCode("", "matches").error.code, "INVALID_FOOTBALL_DE_WIDGET");
  assert.equal(validateFootballDeWidgetCode(`<div data-id="${id}" data-type="table"></div>`, "matches").error.code, "INVALID_FOOTBALL_DE_WIDGET_TYPE");
});
