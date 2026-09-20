import test from "node:test";
import assert from "node:assert/strict";
import {
  attachJuniorTeamBirthYears,
  formatTeamBirthYears,
  normalizeTeamBirthYears,
} from "./juniorTeamYearGroups.core.mjs";

test("one current-season birth year uses the singular label", () => {
  assert.equal(formatTeamBirthYears([2016]), "Jahrgang 2016");
});

test("multiple years are deduplicated and sorted numerically", () => {
  assert.deepEqual(normalizeTeamBirthYears([2015, "2014", 2015]), [2014, 2015]);
  assert.equal(formatTeamBirthYears([2015, "2014", 2015]), "Jahrgänge 2014 · 2015");
});

test("missing birth years produce no technical placeholder", () => {
  assert.equal(formatTeamBirthYears([]), "");
  assert.equal(formatTeamBirthYears([undefined, null, "invalid"]), "");
});

test("only mappings belonging to each resolved current-season relation are attached", () => {
  const teams = [
    { id: "team-a", team_season_id: "current-a", training_times_de: "Training A" },
    { id: "team-b", team_season_id: "current-b", training_times_de: "Training B" },
  ];
  const result = attachJuniorTeamBirthYears(teams, [
    { team_season_id: "old-a", birth_year: 2013 },
    { team_season_id: "current-a", birth_year: 2016 },
  ]);

  assert.deepEqual(result[0].birthYears, [2016]);
  assert.deepEqual(result[1].birthYears, []);
  assert.equal(result[0].training_times_de, "Training A");
});

test("a season switch automatically resolves a different team-season mapping", () => {
  const mappings = [
    { team_season_id: "season-2026-team", birth_year: 2016 },
    { team_season_id: "season-2027-team", birth_year: 2017 },
  ];

  assert.deepEqual(
    attachJuniorTeamBirthYears([{ id: "team", team_season_id: "season-2027-team" }], mappings)[0].birthYears,
    [2017],
  );
});
