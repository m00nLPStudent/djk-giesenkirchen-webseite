import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const overview = read("../../../app/(website)/fussball/abteilung/trainer/page.js");
const profile = read("../../../app/(website)/trainer/[slug]/page.js");
const teamCard = read("../team/TeamCoachCard.js");
const tableTennisUi = read("../table-tennis/TableTennisPublicUi.js");

test("the football coach overview normalizes license metadata", () => {
  assert.match(overview, /meta=\{getPublicCoachLicense\(coach\.license\)\}/);
  assert.doesNotMatch(overview, /meta=\{coach\.license\}/);
});

test("team coach cards render only normalized real licenses", () => {
  assert.match(teamCard, /const license = getPublicCoachLicense\(coach\.license\)/);
  assert.match(teamCard, /\{license && \(/);
  assert.doesNotMatch(teamCard, /\{coach\.license &&/);
});

test("coach profiles omit the complete license item when no license is public", () => {
  assert.match(profile, /\.\.\.\(license \? \[\{ label: "Lizenz", value: license/);
  assert.doesNotMatch(profile, /value: coach\.license/);
});

test("table-tennis person cards share the same public license rule", () => {
  assert.match(tableTennisUi, /const license = getPublicCoachLicense\(person\.license\)/);
  assert.match(tableTennisUi, /\{license && <p/);
  assert.doesNotMatch(tableTennisUi, /\{person\.license &&/);
});
