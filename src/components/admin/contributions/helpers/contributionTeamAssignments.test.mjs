import test from "node:test";
import assert from "node:assert/strict";

import {
  buildContributionPlayerOption,
  getContributionSnapshotFieldState,
  getPlayerAssignmentsForSeason,
} from "./contributionTeamAssignments.js";

const player = { id: "player-1", first_name: "Anna", last_name: "Becker" };

test("single season assignment is auto-selected", () => {
  const playerOption = buildContributionPlayerOption(player, [
    {
      seasonId: "season-1",
      teamSeasonId: "ts-1",
      teamId: "team-1",
      teamName: "U17",
      isActive: true,
      sortOrder: 2,
    },
  ]);

  const state = getContributionSnapshotFieldState({
    playerOption,
    seasonId: "season-1",
    currentSeasonId: "season-1",
  });

  assert.equal(state.status, "single");
  assert.equal(state.defaultValue, "U17");
});

test("multiple season assignments stay selectable and deterministic", () => {
  const playerOption = buildContributionPlayerOption(player, [
    {
      seasonId: "season-1",
      teamSeasonId: "ts-2",
      teamId: "team-2",
      teamName: "U19",
      isActive: true,
      sortOrder: 2,
    },
    {
      seasonId: "season-1",
      teamSeasonId: "ts-1",
      teamId: "team-1",
      teamName: "U17",
      isActive: true,
      sortOrder: 1,
    },
  ]);

  const assignments = getPlayerAssignmentsForSeason(playerOption, "season-1");
  const state = getContributionSnapshotFieldState({
    playerOption,
    seasonId: "season-1",
    currentSeasonId: "season-1",
  });

  assert.deepEqual(assignments.map((assignment) => assignment.teamName), [
    "U17",
    "U19",
  ]);
  assert.equal(state.status, "multiple");
  assert.equal(state.defaultValue, "U17");
});

test("missing assignment keeps snapshot empty", () => {
  const playerOption = buildContributionPlayerOption(player, []);
  const state = getContributionSnapshotFieldState({
    playerOption,
    seasonId: "season-2",
    currentSeasonId: "season-1",
  });

  assert.equal(state.status, "none");
  assert.equal(state.defaultValue, "");
});

