import test from "node:test";
import assert from "node:assert/strict";
import { createCoachAssignmentRollbackPlan } from "./coachWriteRollbackCore.mjs";

test("createCoachAssignmentRollbackPlan restores only changed rows", () => {
  const plan = createCoachAssignmentRollbackPlan(
    [
      {
        coachTeamSeasonId: "cts-1",
        teamSeasonId: "ts-1",
        roleDe: "Trainer",
        roleEn: "Coach",
        sortOrder: 1,
        isActive: true,
      },
      {
        coachTeamSeasonId: "cts-2",
        teamSeasonId: "ts-2",
        roleDe: "Betreuer",
        roleEn: "Supervisor",
        sortOrder: 2,
        isActive: false,
      },
      {
        coachTeamSeasonId: "cts-3",
        teamSeasonId: "ts-3",
        roleDe: "Torwarttrainer",
        roleEn: "Goalkeeper Coach",
        sortOrder: 3,
        isActive: true,
      },
    ],
    {
      deactivatedIds: ["cts-1"],
      updatedIds: ["cts-3"],
      reactivatedIds: ["cts-2"],
      insertedIds: ["cts-new"],
    },
  );

  assert.deepEqual(plan, [
    { type: "toggle", assignmentId: "cts-1", isActive: true },
    {
      type: "restore",
      assignmentId: "cts-3",
      payload: {
        team_season_id: "ts-3",
        role_de: "Torwarttrainer",
        role_en: "Goalkeeper Coach",
        is_active: true,
        sort_order: 3,
      },
    },
    {
      type: "restore",
      assignmentId: "cts-2",
      payload: {
        team_season_id: "ts-2",
        role_de: "Betreuer",
        role_en: "Supervisor",
        is_active: false,
        sort_order: 2,
      },
    },
    { type: "toggle", assignmentId: "cts-new", isActive: false },
  ]);
});

test("createCoachAssignmentRollbackPlan ignores unrelated rows", () => {
  const plan = createCoachAssignmentRollbackPlan(
    [
      {
        coachTeamSeasonId: "cts-1",
        teamSeasonId: "ts-1",
        roleDe: "Trainer",
        roleEn: "Coach",
      },
    ],
    {
      updatedIds: ["cts-missing"],
      reactivatedIds: [],
      insertedIds: [],
      deactivatedIds: [],
    },
  );

  assert.deepEqual(plan, []);
});
