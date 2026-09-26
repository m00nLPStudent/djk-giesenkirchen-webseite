import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  CONTACT_CATEGORY_OPTIONS,
  ROLE_TEMPLATE_BY_VALUE,
  ROLE_TEMPLATES,
} from "./helpers/settingsOptions.js";

const handlers = fs.readFileSync(
  new URL("./helpers/contactHandlers.js", import.meta.url),
  "utf8",
);

test("general contacts retain existing role templates and add Besitzer centrally", () => {
  const values = ROLE_TEMPLATES.map((template) => template.value);

  for (const existing of [
    "jugendschutzbeauftragter",
    "platzwart",
    "webmaster",
    "vorsitzender-verein",
    "vorsitzender-fussball",
    "geschaeftsfuehrer-verein",
    "geschaeftsfuehrer-fussball",
    "jugendleiter",
    "kassierer",
    "presse",
    "sonstiges",
  ]) {
    assert.ok(values.includes(existing), existing);
  }

  assert.ok(CONTACT_CATEGORY_OPTIONS.some((category) => category.value === "allgemein"));
  assert.deepEqual(ROLE_TEMPLATE_BY_VALUE.besitzer, {
    value: "besitzer",
    role_de: "Besitzer",
    role_en: "Owner",
  });
});

test("role-template selection keeps the shared DE and EN prefill contract", () => {
  assert.match(handlers, /const template = ROLE_TEMPLATE_BY_VALUE\[value\]/);
  assert.match(handlers, /role_de: template\.role_de/);
  assert.match(handlers, /role_en: template\.role_en/);
  assert.match(handlers, /return \{ \.\.\.current, role_template: value \}/);
});
