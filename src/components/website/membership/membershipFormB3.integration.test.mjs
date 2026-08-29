import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("form exposes six request types, year display and trainer guidance", async () => {
  const form = await read("./MembershipRequestForm.js");
  for (const value of ["aktives-mitglied-fussball", "aktives-mitglied-tischtennis", "aktives-mitglied-gymnastik-damen", "aktives-mitglied-behindertensport", "trainer-werden", "passives-mitglied"]) assert.match(form, new RegExp(value));
  assert.doesNotMatch(form, /value: "sonstiges"/);
  assert.match(form, /aria-label="Jahrgang"/);
  assert.match(form, /Trainerlizenzen oder andere Qualifikationen/);
});

test("native request-type options remain readable in the Windows Chrome popup", async () => {
  const personal = await read("./components/MembershipPersonalData.js");
  assert.match(personal, /style=\{\{ colorScheme: "dark" \}\}/);
  assert.match(personal, /<option[^>]*className="bg-neutral-950 text-white"/);
});

test("native birthdate indicator keeps mobile spacing without changing date behavior", async () => {
  const personal = await read("./components/MembershipPersonalData.js");
  const css = await read("../../../app/globals.css");
  assert.match(personal, /type="date"[\s\S]*membership-birthdate-input[\s\S]*onBirthdateChange/);
  assert.match(css, /@media \(max-width: 767px\)[\s\S]*membership-birthdate-input::\-webkit-calendar-picker-indicator[\s\S]*margin-right: 0\.375rem/);
});

test("football resolution is debounced, abortable and clears stale selections", async () => {
  const form = await read("./MembershipRequestForm.js");
  assert.match(form, /setTimeout[\s\S]*350/);
  assert.match(form, /AbortController/);
  assert.match(form, /requestSequence/);
  assert.match(form, /desired_team_season_id: ""/);
  assert.match(form, /status === "single"[\s\S]*teamSeasonId/);
  assert.match(form, /status === "multiple"[\s\S]*Bitte eine passende Mannschaft auswählen/);
  assert.doesNotMatch(form, /desired_team_id:/);
});

test("single multiple none and neutral failure states are visible", async () => {
  const football = await read("./components/MembershipFootballData.js");
  for (const status of ["single", "multiple", "none", "current_season_missing", "current_season_ambiguous", "football_department_missing", "unavailable"]) assert.match(football, new RegExp(status));
  assert.match(football, /required[\s\S]*desired_team_season_id/);
  assert.match(football, /manuell zugeordnet/);
  assert.match(football, /trotzdem gesendet/);
});

test("public page no longer loads all teams directly", async () => {
  const page = await read("../../../app/(website)/mitglied-werden/page.js");
  assert.doesNotMatch(page, /from\("teams"\)|@\/lib\/supabase/);
});
