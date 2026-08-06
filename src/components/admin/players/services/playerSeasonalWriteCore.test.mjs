import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPlayerAssignmentPayload,
  buildPlayerMasterPayload,
  buildPlayerMasterRollbackPayload,
  determinePlayerAssignmentOperation,
  PLAYER_ASSIGNMENT_OPERATIONS,
} from "./playerSeasonalWriteCore.mjs";

const placeholderImage = "https://example.test/player-placeholder.png";

test("buildPlayerMasterPayload keeps seasonal assignment snapshots out of the master payload", () => {
  const payload = buildPlayerMasterPayload(
    {
      first_name: "Max",
      last_name: "Mustermann",
      shirt_number: "10",
      position_de: "Mittelfeld",
      position_en: "Midfield",
      image_url: "https://example.test/max.png",
      assignment_sort_order: "4",
      is_captain: true,
    },
    {
      placeholderImage,
    },
  );

  assert.equal(payload.image_url, "https://example.test/max.png");
  assert.equal(Object.hasOwn(payload, "photo_url"), false);
  assert.equal("team_id" in payload, false);
  assert.equal("shirt_number" in payload, false);
  assert.equal("position_de" in payload, false);
  assert.equal("position_en" in payload, false);
  assert.equal("sort_order" in payload, false);
  assert.equal("is_captain" in payload, false);
});

test("buildPlayerMasterPayload falls back to legacy photo_url and placeholder image", () => {
  const legacyPayload = buildPlayerMasterPayload(
    {
      photo_url: "https://example.test/legacy.png",
      assignment_sort_order: "",
    },
    {
      placeholderImage,
    },
  );
  const placeholderPayload = buildPlayerMasterPayload(
    {},
    { placeholderImage },
  );

  assert.equal(legacyPayload.image_url, "https://example.test/legacy.png");
  assert.equal(Object.hasOwn(legacyPayload, "photo_url"), false);
  assert.equal(placeholderPayload.image_url, placeholderImage);
  assert.equal(Object.hasOwn(placeholderPayload, "photo_url"), false);
});

test("buildPlayerMasterRollbackPayload restores the previous master snapshot without team synthesis", () => {
  const payload = buildPlayerMasterRollbackPayload(
    {
      first_name: "Kai",
      last_name: "Rollback",
      photo_url: "https://example.test/legacy.png",
    },
    { placeholderImage },
  );

  assert.equal(payload.image_url, "https://example.test/legacy.png");
  assert.equal(Object.hasOwn(payload, "photo_url"), false);
  assert.equal("team_id" in payload, false);
  assert.equal("shirt_number" in payload, false);
  assert.equal("position_de" in payload, false);
  assert.equal("position_en" in payload, false);
  assert.equal("sort_order" in payload, false);
  assert.equal("is_captain" in payload, false);
});

test("buildPlayerAssignmentPayload writes team season assignment fields", () => {
  const payload = buildPlayerAssignmentPayload(
    {
      shirt_number: "8",
      position_de: "Abwehr",
      position_en: "Defence",
      is_captain: false,
      assignment_sort_order: "3",
    },
    { teamSeasonId: "ts-1" },
  );

  assert.deepEqual(payload, {
    team_season_id: "ts-1",
    shirt_number: 8,
    position_de: "Abwehr",
    position_en: "Defence",
    is_captain: false,
    is_active: true,
    sort_order: 3,
  });
});

test("determinePlayerAssignmentOperation returns create when no current assignment exists", () => {
  const result = determinePlayerAssignmentOperation(
    [],
    {
      teamSeasonId: "ts-1",
    },
  );

  assert.equal(result.ok, true);
  assert.equal(result.operation, PLAYER_ASSIGNMENT_OPERATIONS.CREATE);
});

test("determinePlayerAssignmentOperation returns unchanged for same team season without field changes", () => {
  const result = determinePlayerAssignmentOperation(
    [
      {
        playerTeamSeasonId: "pts-1",
        teamSeasonId: "ts-1",
        shirtNumber: 10,
        positionDe: "Mittelfeld",
        positionEn: "Midfield",
        isCaptain: true,
        sortOrder: 4,
        isActive: true,
      },
    ],
    {
      teamSeasonId: "ts-1",
      shirtNumber: 10,
      positionDe: "Mittelfeld",
      positionEn: "Midfield",
      isCaptain: true,
      sortOrder: 4,
    },
  );

  assert.equal(result.ok, true);
  assert.equal(result.operation, PLAYER_ASSIGNMENT_OPERATIONS.UNCHANGED);
  assert.equal(result.currentAssignmentId, "pts-1");
});

test("determinePlayerAssignmentOperation returns update for same team season with assignment changes", () => {
  const result = determinePlayerAssignmentOperation(
    [
      {
        playerTeamSeasonId: "pts-1",
        teamSeasonId: "ts-1",
        shirtNumber: 9,
        positionDe: "Sturm",
        positionEn: "Forward",
        isCaptain: false,
        sortOrder: 1,
        isActive: true,
      },
    ],
    {
      teamSeasonId: "ts-1",
      shirtNumber: 10,
      positionDe: "Mittelfeld",
      positionEn: "Midfield",
      isCaptain: true,
      sortOrder: 4,
    },
  );

  assert.equal(result.ok, true);
  assert.equal(result.operation, PLAYER_ASSIGNMENT_OPERATIONS.UPDATE);
  assert.equal(result.currentAssignmentId, "pts-1");
});

test("determinePlayerAssignmentOperation creates on team change without inactive target row", () => {
  const result = determinePlayerAssignmentOperation(
    [
      {
        playerTeamSeasonId: "pts-1",
        teamSeasonId: "ts-old",
        isActive: true,
      },
    ],
    {
      teamSeasonId: "ts-new",
    },
  );

  assert.equal(result.ok, true);
  assert.equal(result.operation, PLAYER_ASSIGNMENT_OPERATIONS.CREATE);
  assert.equal(result.deactivateCurrentAssignmentId, "pts-1");
});

test("determinePlayerAssignmentOperation reactivates an inactive target row", () => {
  const result = determinePlayerAssignmentOperation(
    [
      {
        playerTeamSeasonId: "pts-active",
        teamSeasonId: "ts-old",
        isActive: true,
      },
      {
        playerTeamSeasonId: "pts-inactive",
        teamSeasonId: "ts-new",
        isActive: false,
      },
    ],
    {
      teamSeasonId: "ts-new",
      shirtNumber: 11,
    },
  );

  assert.equal(result.ok, true);
  assert.equal(result.operation, PLAYER_ASSIGNMENT_OPERATIONS.REACTIVATE);
  assert.equal(result.currentAssignmentId, "pts-active");
  assert.equal(result.targetAssignmentId, "pts-inactive");
});

test("determinePlayerAssignmentOperation reactivates a matching inactive row when no active assignment exists", () => {
  const result = determinePlayerAssignmentOperation(
    [
      {
        playerTeamSeasonId: "pts-old",
        teamSeasonId: "ts-1",
        isActive: false,
      },
    ],
    {
      teamSeasonId: "ts-1",
    },
  );

  assert.equal(result.ok, true);
  assert.equal(result.operation, PLAYER_ASSIGNMENT_OPERATIONS.REACTIVATE);
  assert.equal(result.targetAssignmentId, "pts-old");
});

test("determinePlayerAssignmentOperation blocks multiple active assignments", () => {
  const result = determinePlayerAssignmentOperation(
    [
      {
        playerTeamSeasonId: "pts-1",
        teamSeasonId: "ts-1",
        isActive: true,
      },
      {
        playerTeamSeasonId: "pts-2",
        teamSeasonId: "ts-2",
        isActive: true,
      },
    ],
    {
      teamSeasonId: "ts-3",
    },
  );

  assert.equal(result.ok, false);
  assert.equal(result.code, "MULTIPLE_ACTIVE_CURRENT_ASSIGNMENTS");
});

test("determinePlayerAssignmentOperation blocks missing team season targets", () => {
  const result = determinePlayerAssignmentOperation(
    [],
    { teamSeasonId: "" },
  );

  assert.equal(result.ok, false);
  assert.equal(result.code, "INVALID_TEAM_SEASON_ID");
});
