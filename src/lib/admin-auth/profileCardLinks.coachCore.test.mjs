import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCoachAssignmentsByCoachId,
  createCoachCardRows,
} from "./profileCardLinks.coachCore.mjs";

test("buildCoachAssignmentsByCoachId keeps only active current-season assignments", () => {
  const assignmentsByCoachId = buildCoachAssignmentsByCoachId(
    [
      {
        id: "cts-1",
        coach_id: "coach-1",
        team_season_id: "ts-current",
        role_de: "Cheftrainer",
        is_active: true,
      },
      {
        id: "cts-2",
        coach_id: "coach-1",
        team_season_id: "ts-old",
        role_de: "Altrolle",
        is_active: true,
      },
    ],
    [
      { id: "ts-current", team_id: "team-1", season_id: "season-1", is_active: true },
      { id: "ts-old", team_id: "team-2", season_id: "season-2", is_active: true },
    ],
    "season-1",
  );

  assert.deepEqual(assignmentsByCoachId.get("coach-1"), [
    {
      coachId: "coach-1",
      coachTeamSeasonId: "cts-1",
      teamSeasonId: "ts-current",
      teamId: "team-1",
      teamNameDe: null,
      teamNameEn: null,
      teamSlug: null,
      roleDe: "Cheftrainer",
      roleEn: null,
      isActive: true,
      sortOrder: null,
      createdAt: null,
    },
  ]);
});

test("createCoachCardRows prefers relational roles and preserves multiple labels", () => {
  const [row] = createCoachCardRows(
    [
      {
        id: "coach-1",
        first_name: "Mira",
        last_name: "Muster",
        role_de: "Legacy Trainer",
      },
    ],
    {
      currentSeasonRows: [{ id: "season-1", name: "2026/27", is_current: true }],
      assignmentRows: [
        {
          id: "cts-1",
          coach_id: "coach-1",
          team_season_id: "ts-1",
          role_de: "Cheftrainer",
          sort_order: 2,
          is_active: true,
        },
        {
          id: "cts-2",
          coach_id: "coach-1",
          team_season_id: "ts-2",
          role_de: "Torwarttrainer",
          sort_order: 1,
          is_active: true,
        },
      ],
      teamSeasonRows: [
        { id: "ts-1", team_id: "team-1", season_id: "season-1", is_active: true },
        { id: "ts-2", team_id: "team-2", season_id: "season-1", is_active: true },
      ],
    },
  );

  assert.equal(row.label, "Mira Muster - Torwarttrainer, Cheftrainer");
});

test("createCoachCardRows falls back to master role only without current-season assignments", () => {
  const [row] = createCoachCardRows(
    [
      {
        id: "coach-1",
        first_name: "Mira",
        last_name: "Muster",
        role_de: "Legacy Trainer",
      },
    ],
    {
      currentSeasonRows: [{ id: "season-1", name: "2026/27", is_current: true }],
      assignmentRows: [],
      teamSeasonRows: [],
    },
  );

  assert.equal(row.label, "Mira Muster - Legacy Trainer");
});
