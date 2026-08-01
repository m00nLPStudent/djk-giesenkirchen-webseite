import test from "node:test";
import assert from "node:assert/strict";
import {
  buildTeamCoachSelectionState,
  planTeamCoachAssignmentSync,
} from "./teamCoachAssignments.core.mjs";

const COACHES = [
  {
    id: "coach-a",
    first_name: "Alex",
    last_name: "A",
    role: "Trainer",
    role_de: "Trainer",
    role_en: "Coach",
    sort_order: 5,
  },
  {
    id: "coach-b",
    first_name: "Bela",
    last_name: "B",
    role: "Betreuer",
    role_de: "Betreuer",
    role_en: "Supervisor",
    sort_order: 2,
  },
];

test("buildTeamCoachSelectionState marks a multi-team coach as assigned in each team edit", () => {
  const currentSeasonAssignments = [
    {
      id: "cts-a-1",
      coach_id: "coach-a",
      team_season_id: "ts-a",
      role_de: "Trainer",
      role_en: "Coach",
      sort_order: 1,
      is_active: true,
    },
    {
      id: "cts-a-2",
      coach_id: "coach-a",
      team_season_id: "ts-b",
      role_de: "Co-Trainer",
      role_en: "Assistant Coach",
      sort_order: 2,
      is_active: true,
    },
  ];

  const teamAState = buildTeamCoachSelectionState({
    coaches: COACHES,
    coachAssignments: currentSeasonAssignments,
    currentSeasonCoachAssignments: currentSeasonAssignments,
    teamSeasonId: "ts-a",
  });
  const teamBState = buildTeamCoachSelectionState({
    coaches: COACHES,
    coachAssignments: currentSeasonAssignments,
    currentSeasonCoachAssignments: currentSeasonAssignments,
    teamSeasonId: "ts-b",
  });

  assert.equal(teamAState[0].isAssignedToCurrentTeam, true);
  assert.equal(teamAState[0].role_de, "Trainer");
  assert.equal(teamAState[0].hasOtherActiveAssignments, true);
  assert.equal(teamBState[0].isAssignedToCurrentTeam, true);
  assert.equal(teamBState[0].role_de, "Co-Trainer");
  assert.equal(teamAState[0].currentRoleSource, "active_assignment");
});

test("buildTeamCoachSelectionState ignores historical and inactive rows", () => {
  const teamState = buildTeamCoachSelectionState({
    coaches: COACHES,
    coachAssignments: [
      {
        id: "cts-old",
        coach_id: "coach-a",
        team_season_id: "ts-old",
        role_de: "Alt",
        is_active: true,
      },
      {
        id: "cts-inactive",
        coach_id: "coach-b",
        team_season_id: "ts-a",
        role_de: "Betreuer",
        is_active: false,
      },
    ],
    currentSeasonCoachAssignments: [],
    teamSeasonId: "ts-a",
  });

  assert.equal(teamState[0].isAssignedToCurrentTeam, false);
  assert.equal(teamState[1].isAssignedToCurrentTeam, false);
  assert.deepEqual(teamState[1].reactivationRoleLabels, ["Betreuer"]);
  assert.equal(teamState[1].currentRoleSource, "inactive_assignment");
});

test("buildTeamCoachSelectionState marks teamless coaches with an explicit legacy fallback state", () => {
  const teamState = buildTeamCoachSelectionState({
    coaches: [
      {
        id: "coach-c",
        first_name: "Clara",
        role_de: "Trainer",
      },
    ],
    coachAssignments: [],
    currentSeasonCoachAssignments: [],
    teamSeasonId: "ts-a",
  });

  assert.equal(teamState[0].isAssignedToCurrentTeam, false);
  assert.deepEqual(teamState[0].currentRoleLabels, []);
  assert.deepEqual(teamState[0].legacyRoleLabels, ["Trainer"]);
  assert.equal(teamState[0].legacyRoleFallbackUsed, true);
  assert.equal(teamState[0].currentRoleSource, "legacy_fallback");
});

test("planTeamCoachAssignmentSync preserves other-team relations and current roles", () => {
  const plan = planTeamCoachAssignmentSync({
    existingAssignments: [
      {
        id: "cts-a",
        coach_id: "coach-a",
        team_season_id: "ts-a",
        role_de: "Trainer",
        is_active: true,
      },
      {
        id: "cts-b-inactive",
        coach_id: "coach-b",
        team_season_id: "ts-a",
        role_de: "Betreuer",
        is_active: false,
      },
    ],
    selectedCoachIds: ["coach-a", "coach-b"],
    coachesById: new Map(COACHES.map((coach) => [coach.id, coach])),
    teamSeasonId: "ts-a",
  });

  assert.deepEqual(plan.deactivateIds, []);
  assert.deepEqual(plan.reactivateIds, ["cts-b-inactive"]);
  assert.equal(plan.createRows.length, 0);
});

test("planTeamCoachAssignmentSync deactivates only current-team rows and creates new assignment when needed", () => {
  const plan = planTeamCoachAssignmentSync({
    existingAssignments: [
      {
        id: "cts-a",
        coach_id: "coach-a",
        team_season_id: "ts-a",
        role_de: "Trainer",
        is_active: true,
      },
    ],
    selectedCoachIds: ["coach-b"],
    coachesById: new Map(COACHES.map((coach) => [coach.id, coach])),
    teamSeasonId: "ts-a",
  });

  assert.deepEqual(plan.deactivateIds, ["cts-a"]);
  assert.deepEqual(plan.reactivateIds, []);
  assert.deepEqual(plan.createRows, [
    {
      coach_id: "coach-b",
      team_season_id: "ts-a",
      role_de: "Betreuer",
      role_en: "Supervisor",
      sort_order: 2,
      is_active: true,
    },
  ]);
});

test("planTeamCoachAssignmentSync reuses relational current-season roles before master fallbacks", () => {
  const plan = planTeamCoachAssignmentSync({
    existingAssignments: [],
    selectedCoachIds: ["coach-a"],
    coachesById: new Map(COACHES.map((coach) => [coach.id, coach])),
    currentSeasonAssignmentsByCoachId: new Map([
      [
        "coach-a",
        [
          {
            id: "cts-b",
            role_de: "Cheftrainer",
            role_en: "Head Coach",
            sort_order: 1,
            created_at: "2026-08-01",
          },
        ],
      ],
    ]),
    teamSeasonId: "ts-new",
  });

  assert.deepEqual(plan.createRows, [
    {
      coach_id: "coach-a",
      team_season_id: "ts-new",
      role_de: "Cheftrainer",
      role_en: "Head Coach",
      sort_order: 5,
      is_active: true,
    },
  ]);
});
