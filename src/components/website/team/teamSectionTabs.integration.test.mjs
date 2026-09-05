import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const shared = read("./TeamSectionTabs.js");
const football = read("./TeamDetailTabs.js");

test("shared team tabs expose one active content area and accessible controls", () => {
  assert.match(shared, /"use client"/);
  assert.match(shared, /initialTab = "training"/);
  assert.match(shared, /aria-pressed=\{isActive\}/);
  assert.match(shared, /aria-controls=\{`team-section-\$\{tab\.id\}`\}/);
  assert.match(shared, /focus-visible:outline-red-400/);
  assert.match(shared, /active\.content/);
  assert.doesNotMatch(shared, /overflow-x-auto/);
});

test("football retains its five existing sections and default training state", () => {
  for (const label of ["Training", "Kader", "Trainer", "Spielbetrieb", "Kontakt"]) assert.match(football, new RegExp(`label: "${label}"`));
  assert.match(football, /initialTab="training"/);
  assert.match(football, /TeamTrainingInfo/);
  assert.match(football, /TeamCompetitionSection/);
});
