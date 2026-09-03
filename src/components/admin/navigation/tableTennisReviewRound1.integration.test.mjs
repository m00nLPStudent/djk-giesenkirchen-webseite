import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("TT routes preserve explicit table-tennis context", () => {
  const teams = read("../../../app/admin/teams/page.js");
  const players = read("../../../app/admin/players/page.js");
  const coaches = read("../../../app/admin/coaches/page.js");
  const board = read("../../../app/admin/department/page.js");
  for (const source of [teams, players, coaches]) assert.match(source, /requiredDepartmentSlug === "fussball" \? "football" : "table-tennis"/);
  assert.match(board, /requiredDepartment\.slug === "fussball" \? "football" : "table-tennis"/);
});

test("TT player and coach mutations validate the explicit department", () => {
  const players = read("../../../app/admin/players/actions.js");
  const coaches = read("../../../app/admin/coaches/actions.js");
  assert.match(players, /targetDepartmentSlug !== expectedDepartmentSlug/);
  assert.match(players, /\["Rechts", "Links"\]/);
  assert.match(coaches, /targetDepartmentSlugs\.some\(\(slug\) => slug !== expectedDepartmentSlug\)/);
  assert.match(coaches, /tableTennisCoachLicenses/);
  assert.match(coaches, /Torwarttrainer/);
});

test("training contract separates types and location types by department", () => {
  const actions = read("../../../app/admin/teams/training/actions.js");
  const options = read("../teams/training/trainingOptions.js");
  assert.match(actions, /tischtennis: new Set\(\["training", "foerdertraining", "sonstiges"\]\)/);
  assert.match(actions, /tischtennis: new Set\(\["halle"\]\)/);
  assert.match(options, /kleinfeld/);
  assert.match(options, /rasenplatz/);
  assert.match(options, /kunstrasen/);
  assert.match(options, /halle/);
});

test("public training events expose a mapped optional location type", () => {
  const virtualTraining = read("../../../lib/events/virtualTraining.js");
  const formatter = read("../../../lib/events/eventFormatter.js");
  assert.match(virtualTraining, /training_location_type: slot\.training_location_type \|\| null/);
  for (const label of ["Kleinfeld", "Rasenplatz", "Kunstrasen", "Halle"]) assert.match(formatter, new RegExp(label));
});

test("TT forms use strong hand and sport-specific coach options", () => {
  const player = read("../players/forms/AdminPlayersForm.js");
  const profile = read("../players/forms/fields/PlayerProfileFields.js");
  const coach = read("../coaches/forms/fields/CoachRoleFields.js");
  assert.match(player, /sportContext === "table_tennis"/);
  assert.match(profile, /form\.strong_hand/);
  assert.match(profile, /form\.strong_foot/);
  assert.match(coach, /tableTennisCoachLicenses/);
  assert.match(coach, /role !== "Torwarttrainer"/);
});
