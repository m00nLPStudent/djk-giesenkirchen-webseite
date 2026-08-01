import test from "node:test";
import assert from "node:assert/strict";

import { createPlayerAssignmentRollbackPlan } from "./playerWriteRollbackCore.mjs";

test("createPlayerAssignmentRollbackPlan restores updated, reactivated, deactivated and inserted rows deterministically", () => {
  const plan = createPlayerAssignmentRollbackPlan(
    [
      {
        playerTeamSeasonId: "pts-active",
        teamSeasonId: "ts-1",
        shirtNumber: 8,
        positionDe: "Mittelfeld",
        positionEn: "Midfield",
        isCaptain: true,
        isActive: true,
        sortOrder: 1,
      },
      {
        playerTeamSeasonId: "pts-inactive",
        teamSeasonId: "ts-2",
        shirtNumber: 4,
        positionDe: "Abwehr",
        positionEn: "Defence",
        isCaptain: false,
        isActive: false,
        sortOrder: 5,
      },
    ],
    {
      updatedIds: ["pts-active"],
      reactivatedIds: ["pts-inactive"],
      insertedIds: ["pts-new"],
      deactivatedIds: ["pts-active"],
    },
  );

  assert.deepEqual(plan, [
    { type: "toggle", assignmentId: "pts-active", isActive: true },
    {
      type: "restore",
      assignmentId: "pts-active",
      payload: {
        team_season_id: "ts-1",
        shirt_number: 8,
        position_de: "Mittelfeld",
        position_en: "Midfield",
        is_captain: true,
        is_active: true,
        sort_order: 1,
      },
    },
    {
      type: "restore",
      assignmentId: "pts-inactive",
      payload: {
        team_season_id: "ts-2",
        shirt_number: 4,
        position_de: "Abwehr",
        position_en: "Defence",
        is_captain: false,
        is_active: false,
        sort_order: 5,
      },
    },
    { type: "toggle", assignmentId: "pts-new", isActive: false },
  ]);
});
