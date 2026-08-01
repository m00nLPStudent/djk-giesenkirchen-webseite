import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCoachMasterPayload,
  buildCoachMasterRollbackPayload,
  determineCoachAssignmentOperations,
  normalizeCoachAssignments,
} from "./coachSeasonalWriteCore.mjs";

const TEAM_SEASON_OPTIONS = [
  {
    teamSeasonId: "ts-1",
    teamId: "team-1",
    teamNameDe: "A-Jugend",
  },
  {
    teamSeasonId: "ts-2",
    teamId: "team-2",
    teamNameDe: "B-Jugend",
  },
];

test("buildCoachMasterPayload keeps legacy master role separate from assignment roles", () => {
  const payload = buildCoachMasterPayload(
    {
      first_name: "Mira",
      last_name: "Beispiel",
      image_url: "https://example.test/mira.png",
      role: "Fallback-Trainer",
      sort_order: 9,
    },
    {
      primaryAssignment: {
        teamId: "team-1",
        teamNameDe: "A-Jugend",
        roleDe: "Cheftrainer",
        roleEn: "Head Coach",
        sortOrder: 2,
      },
      placeholderImage: "https://example.test/placeholder.png",
    },
  );

  assert.equal(payload.team_id, "team-1");
  assert.equal(payload.team_name, "A-Jugend");
  assert.equal(payload.role, "Fallback-Trainer");
  assert.equal(payload.role_de, "Fallback-Trainer");
  assert.equal(payload.role_en, null);
  assert.equal(payload.image_url, "https://example.test/mira.png");
  assert.equal("photo_url" in payload, false);
  assert.equal(payload.sort_order, 2);
});

test("buildCoachMasterPayload falls back to legacy photo_url and role_de when needed", () => {
  const payload = buildCoachMasterPayload(
    {
      first_name: "Kai",
      last_name: "Fallback",
      role_de: "Betreuer",
      photo_url: "https://example.test/legacy.png",
    },
    { placeholderImage: "https://example.test/placeholder.png" },
  );

  assert.equal(payload.team_id, null);
  assert.equal(payload.team_name, null);
  assert.equal(payload.role, "Betreuer");
  assert.equal(payload.image_url, "https://example.test/legacy.png");
  assert.equal("photo_url" in payload, false);
});

test("buildCoachMasterRollbackPayload restores the previous master snapshot without assignment synthesis", () => {
  const payload = buildCoachMasterRollbackPayload(
    {
      first_name: "Kai",
      last_name: "Rollback",
      name: "Kai Rollback",
      slug: "kai-rollback",
      role: "Legacy",
      role_de: "Betreuer",
      role_en: "Supervisor",
      team_id: "team-1",
      team_name: "A-Jugend",
      photo_url: "https://example.test/legacy.png",
      sort_order: 4,
      is_active: false,
    },
    { placeholderImage: "https://example.test/placeholder.png" },
  );

  assert.equal(payload.role, "Legacy");
  assert.equal(payload.role_de, "Betreuer");
  assert.equal(payload.role_en, "Supervisor");
  assert.equal(payload.team_id, "team-1");
  assert.equal(payload.team_name, "A-Jugend");
  assert.equal(payload.image_url, "https://example.test/legacy.png");
  assert.equal(payload.is_active, false);
});

test("normalizeCoachAssignments resolves seasonal targets and sorts deterministically", () => {
  const assignments = normalizeCoachAssignments(
    [
      { team_season_id: "ts-2", role_de: "Betreuer", assignment_sort_order: 5 },
      { team_season_id: "ts-1", role_de: "Trainer", assignment_sort_order: 1 },
    ],
    TEAM_SEASON_OPTIONS,
  );

  assert.deepEqual(
    assignments.map((assignment) => assignment.teamSeasonId),
    ["ts-1", "ts-2"],
  );
  assert.equal(assignments[0].teamId, "team-1");
  assert.equal(assignments[0].roleEn, "Coach");
});

test("determineCoachAssignmentOperations creates inserts for new coaches", () => {
  const result = determineCoachAssignmentOperations(null, [
    {
      teamSeasonId: "ts-1",
      roleDe: "Trainer",
      roleEn: "Coach",
      sortOrder: 1,
    },
  ]);

  assert.equal(result.ok, true);
  assert.equal(result.updates.length, 0);
  assert.equal(result.reactivations.length, 0);
  assert.equal(result.inserts.length, 1);
  assert.equal(result.deactivateIds.length, 0);
  assert.equal(result.unchangedIds.length, 0);
});

test("determineCoachAssignmentOperations updates same-team rows and deactivates removed rows", () => {
  const result = determineCoachAssignmentOperations(
    {
      assignments: [
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
          isActive: true,
        },
      ],
    },
    [
      {
        coachTeamSeasonId: "cts-1",
        teamSeasonId: "ts-1",
        roleDe: "Cheftrainer",
        roleEn: "Head Coach",
        sortOrder: 3,
      },
    ],
  );

  assert.equal(result.ok, true);
  assert.equal(result.updates.length, 1);
  assert.equal(result.reactivations.length, 0);
  assert.equal(result.inserts.length, 0);
  assert.deepEqual(result.deactivateIds, ["cts-2"]);
});

test("determineCoachAssignmentOperations creates and deactivates on team switch without existing target row", () => {
  const result = determineCoachAssignmentOperations(
    {
      assignments: [
        {
          coachTeamSeasonId: "cts-1",
          teamSeasonId: "ts-1",
          roleDe: "Trainer",
          roleEn: "Coach",
          sortOrder: 1,
          isActive: true,
        },
      ],
    },
    [
      {
        coachTeamSeasonId: "cts-1",
        teamSeasonId: "ts-2",
        roleDe: "Trainer",
        roleEn: "Coach",
        sortOrder: 1,
      },
    ],
  );

  assert.equal(result.ok, true);
  assert.equal(result.updates.length, 0);
  assert.equal(result.reactivations.length, 0);
  assert.equal(result.inserts.length, 1);
  assert.equal(result.inserts[0].coachTeamSeasonId, null);
  assert.deepEqual(result.deactivateIds, ["cts-1"]);
});

test("determineCoachAssignmentOperations reactivates an existing inactive row instead of inserting", () => {
  const result = determineCoachAssignmentOperations(
    {
      assignments: [
        {
          coachTeamSeasonId: "cts-old",
          teamSeasonId: "ts-1",
          roleDe: "Trainer",
          roleEn: "Coach",
          sortOrder: 7,
          isActive: false,
        },
      ],
    },
    [
      {
        teamSeasonId: "ts-1",
        roleDe: "Co-Trainer",
        roleEn: "Assistant Coach",
        sortOrder: 2,
      },
    ],
  );

  assert.equal(result.ok, true);
  assert.equal(result.inserts.length, 0);
  assert.equal(result.updates.length, 0);
  assert.equal(result.reactivations.length, 1);
  assert.equal(result.reactivations[0].coachTeamSeasonId, "cts-old");
  assert.deepEqual(result.deactivateIds, []);
});

test("determineCoachAssignmentOperations keeps unchanged rows untouched", () => {
  const result = determineCoachAssignmentOperations(
    {
      assignments: [
        {
          coachTeamSeasonId: "cts-1",
          teamSeasonId: "ts-1",
          roleDe: "Trainer",
          roleEn: "Coach",
          sortOrder: 1,
          isActive: true,
        },
      ],
    },
    [
      {
        coachTeamSeasonId: "cts-1",
        teamSeasonId: "ts-1",
        roleDe: "Trainer",
        roleEn: "Coach",
        sortOrder: 1,
      },
    ],
  );

  assert.equal(result.ok, true);
  assert.equal(result.updates.length, 0);
  assert.equal(result.reactivations.length, 0);
  assert.equal(result.inserts.length, 0);
  assert.deepEqual(result.unchangedIds, ["cts-1"]);
});

test("determineCoachAssignmentOperations reactivates an inactive target row on team switch", () => {
  const result = determineCoachAssignmentOperations(
    {
      assignments: [
        {
          coachTeamSeasonId: "cts-active",
          teamSeasonId: "ts-1",
          roleDe: "Trainer",
          roleEn: "Coach",
          sortOrder: 1,
          isActive: true,
        },
        {
          coachTeamSeasonId: "cts-inactive",
          teamSeasonId: "ts-2",
          roleDe: "Betreuer",
          roleEn: "Supervisor",
          sortOrder: 5,
          isActive: false,
        },
      ],
    },
    [
      {
        coachTeamSeasonId: "cts-active",
        teamSeasonId: "ts-2",
        roleDe: "Co-Trainer",
        roleEn: "Assistant Coach",
        sortOrder: 3,
      },
    ],
  );

  assert.equal(result.ok, true);
  assert.equal(result.inserts.length, 0);
  assert.equal(result.reactivations.length, 1);
  assert.equal(result.reactivations[0].coachTeamSeasonId, "cts-inactive");
  assert.deepEqual(result.deactivateIds, ["cts-active"]);
});

test("determineCoachAssignmentOperations blocks duplicate team seasons regardless of role", () => {
  const result = determineCoachAssignmentOperations(null, [
    { teamSeasonId: "ts-1", roleDe: "Trainer" },
    { teamSeasonId: "ts-1", roleDe: "Co-Trainer" },
  ]);

  assert.equal(result.ok, false);
  assert.equal(result.code, "DUPLICATE_TEAM_SEASON_ASSIGNMENT");
});

test("determineCoachAssignmentOperations blocks unknown existing assignments", () => {
  const result = determineCoachAssignmentOperations(
    { assignments: [] },
    [{ coachTeamSeasonId: "cts-missing", teamSeasonId: "ts-1", roleDe: "Trainer" }],
  );

  assert.equal(result.ok, false);
  assert.equal(result.code, "UNKNOWN_COACH_ASSIGNMENT");
});
