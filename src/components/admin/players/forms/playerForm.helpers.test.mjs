import test from "node:test";
import assert from "node:assert/strict";

import {
  createInitialPlayerFormData,
  getPlayerFormBlockingMessageData,
  getPlayerFormWarningMessageData,
} from "./playerForm.core.mjs";

const CURRENT_SEASON_STATUSES = {
  RESOLVED: "CURRENT_SEASON_RESOLVED",
  MISSING: "CURRENT_SEASON_MISSING",
  AMBIGUOUS: "CURRENT_SEASON_AMBIGUOUS",
};

const PLACEHOLDER_IMAGE = "https://example.test/player-placeholder.png";

test("createInitialPlayerForm uses the single active current assignment", () => {
  const form = createInitialPlayerFormData(
    { first_name: "Mia", last_name: "Sommer" },
    {
      primaryAssignment: {
        teamSeasonId: "ts-1",
        shirtNumber: 7,
        positionDe: "Abwehr",
        positionEn: "Defence",
        sortOrder: 3,
        isCaptain: true,
      },
      hasMultipleActiveAssignments: false,
    },
    PLACEHOLDER_IMAGE,
  );

  assert.equal(form.team_season_id, "ts-1");
  assert.equal(form.shirt_number, 7);
  assert.equal(form.position_de, "Abwehr");
  assert.equal(form.position_en, "Defence");
  assert.equal(form.assignment_sort_order, 3);
  assert.equal(form.is_captain, true);
});

test("createInitialPlayerForm stays empty when no active current assignment exists", () => {
  const form = createInitialPlayerFormData(
    {
      team_id: "legacy-team",
      shirt_number: 11,
      position_de: "Legacy",
      position_en: "Legacy",
      sort_order: 4,
      is_captain: true,
    },
    {
      primaryAssignment: null,
      hasActiveAssignment: false,
      hasMultipleActiveAssignments: false,
    },
    PLACEHOLDER_IMAGE,
  );

  assert.equal(form.team_season_id, "");
  assert.equal(form.shirt_number, "");
  assert.equal(form.position_de, "");
  assert.equal(form.position_en, "");
  assert.equal(form.assignment_sort_order, 0);
  assert.equal(form.is_captain, false);
});

test("createInitialPlayerForm does not silently prefill one assignment when multiple are active", () => {
  const form = createInitialPlayerFormData(
    { first_name: "Lina" },
    {
      primaryAssignment: {
        teamSeasonId: "ts-1",
        shirtNumber: 3,
      },
      hasMultipleActiveAssignments: true,
    },
    PLACEHOLDER_IMAGE,
  );

  assert.equal(form.team_season_id, "");
  assert.equal(form.shirt_number, "");
});

test("createInitialPlayerForm still keeps master-only player fields", () => {
  const form = createInitialPlayerFormData(
    {
      first_name: "Nora",
      last_name: "Beispiel",
      photo_url: "https://example.test/nora.png",
      description_de: "Text",
      birthdate: "2012-04-15",
      joined_at: "2020-01-01",
      nationality: "DE",
      gender: "female",
    },
    null,
    PLACEHOLDER_IMAGE,
  );

  assert.equal(form.first_name, "Nora");
  assert.equal(form.image_url, "https://example.test/nora.png");
  assert.equal(form.description_de, "Text");
  assert.equal(form.birthdate, "2012-04-15");
});

test("getPlayerFormBlockingMessage blocks missing current season", () => {
  const message = getPlayerFormBlockingMessageData(
    { activeSeasonStatus: CURRENT_SEASON_STATUSES.MISSING, teamOptions: [] },
    null,
    CURRENT_SEASON_STATUSES,
  );

  assert.match(message, /keine aktuelle Saison/i);
});

test("getPlayerFormBlockingMessage blocks ambiguous current season", () => {
  const message = getPlayerFormBlockingMessageData(
    { activeSeasonStatus: CURRENT_SEASON_STATUSES.AMBIGUOUS, teamOptions: [] },
    null,
    CURRENT_SEASON_STATUSES,
  );

  assert.match(message, /mehrere aktuelle Saisons/i);
});

test("getPlayerFormBlockingMessage blocks multiple active assignments", () => {
  const message = getPlayerFormBlockingMessageData(
    {
      activeSeasonStatus: CURRENT_SEASON_STATUSES.RESOLVED,
      teamOptions: [{ teamSeasonId: "ts-1" }],
    },
    { hasMultipleActiveAssignments: true },
    CURRENT_SEASON_STATUSES,
  );

  assert.match(message, /mehrere aktive Zuordnungen/i);
});

test("getPlayerFormWarningMessage explains an empty current-season assignment state without legacy wording", () => {
  const message = getPlayerFormWarningMessageData(
    {
      hasActiveAssignment: false,
      activeSeasonStatus: CURRENT_SEASON_STATUSES.RESOLVED,
    },
    CURRENT_SEASON_STATUSES,
  );

  assert.match(message, /keine aktive Mannschaftszuordnung/i);
  assert.doesNotMatch(message, /players\\.team_id/i);
});
