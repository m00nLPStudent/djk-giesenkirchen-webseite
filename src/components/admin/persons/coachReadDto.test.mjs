import test from "node:test";
import assert from "node:assert/strict";
import {
  createCoachReadDto,
  createCoachTeamView,
  getCoachDisplayName,
  getCoachImageUrl,
} from "./coachReadDto.js";

test("getCoachDisplayName never treats Kontaktperson as a person name fallback", () => {
  assert.equal(
    getCoachDisplayName({
      first_name: "",
      last_name: "",
      name: "Kontaktperson",
    }),
    "Name nicht hinterlegt",
  );
});

test("createCoachReadDto maps seasonal assignments into the shared coach dto", () => {
  const dto = createCoachReadDto(
    {
      id: "coach-1",
      first_name: "Mira",
      last_name: "Muster",
      slug: "mira-muster",
      image_url: "https://example.test/mira.png",
      email: "mira@example.test",
      nationality: "de",
      is_active: true,
      sort_order: 4,
    },
    {
      assignments: [
        {
          coachTeamSeasonId: "cts-1",
          teamSeasonId: "ts-1",
          teamId: "team-1",
          teamNameDe: "U17",
          teamSlug: "u17",
          roleDe: "Trainer",
          roleEn: "Coach",
          sortOrder: 1,
        },
      ],
      hasActiveAssignment: true,
      hasMultipleActiveAssignments: false,
      activeSeasonStatus: "CURRENT_SEASON_RESOLVED",
    },
    { includeAdminProfileLinked: true },
  );

  assert.equal(dto.coachId, "coach-1");
  assert.equal(dto.displayName, "Mira Muster");
  assert.equal(dto.imageUrl, "https://example.test/mira.png");
  assert.equal(dto.primaryAssignment.teamId, "team-1");
  assert.deepEqual(dto.roleLabels, ["Trainer"]);
  assert.deepEqual(dto.teamNames, ["U17"]);
  assert.equal(dto.primaryTeamName, "U17");
  assert.equal(dto.primaryRoleLabel, "Trainer");
  assert.equal(dto.legacyRoleFallbackUsed, false);
  assert.equal(dto.adminProfileLinked, false);
});

test("createCoachReadDto falls back to photo_url and keeps multiple roles and teams", () => {
  const dto = createCoachReadDto(
    {
      id: "coach-2",
      first_name: "Lea",
      last_name: "Lang",
      photo_url: "https://example.test/lea.png",
      role: "Trainer",
    },
    {
      assignments: [
        {
          coachTeamSeasonId: "cts-1",
          teamSeasonId: "ts-1",
          teamId: "team-a",
          teamNameDe: "U13",
          roleDe: "Trainer",
          sortOrder: 1,
        },
        {
          coachTeamSeasonId: "cts-2",
          teamSeasonId: "ts-2",
          teamId: "team-b",
          teamNameDe: "U15",
          roleDe: "Betreuer",
          sortOrder: 2,
        },
      ],
      hasActiveAssignment: true,
      hasMultipleActiveAssignments: true,
    },
  );

  assert.equal(dto.imageUrl, "https://example.test/lea.png");
  assert.deepEqual(dto.roleLabels, ["Trainer", "Betreuer"]);
  assert.deepEqual(dto.teamNames, ["U13", "U15"]);
  assert.equal(dto.hasMultipleActiveAssignments, true);
  assert.equal(dto.legacyRoleFallbackUsed, false);
});

test("createCoachReadDto marks legacy role fallback only for coaches without assignments", () => {
  const dto = createCoachReadDto(
    {
      id: "coach-legacy",
      first_name: "Tom",
      last_name: "Alt",
      role_de: "Betreuer",
      role_en: "Supervisor",
    },
    {
      assignments: [],
      hasActiveAssignment: false,
      hasMultipleActiveAssignments: false,
    },
  );

  assert.deepEqual(dto.roleLabels, ["Betreuer"]);
  assert.equal(dto.primaryRoleLabel, "Betreuer");
  assert.equal(dto.legacyRoleFallbackUsed, true);
});

test("createCoachTeamView keeps one coach row and aggregates the roles of the current team", () => {
  const coach = createCoachReadDto(
    { id: "coach-3", role: "Trainer" },
    {
      assignments: [
        {
          coachTeamSeasonId: "cts-1",
          teamSeasonId: "ts-1",
          teamId: "team-a",
          teamNameDe: "U17",
          roleDe: "Trainer",
          sortOrder: 1,
        },
        {
          coachTeamSeasonId: "cts-2",
          teamSeasonId: "ts-1",
          teamId: "team-a",
          teamNameDe: "U17",
          roleDe: "Torwarttrainer",
          sortOrder: 2,
        },
        {
          coachTeamSeasonId: "cts-3",
          teamSeasonId: "ts-2",
          teamId: "team-b",
          teamNameDe: "U19",
          roleDe: "Betreuer",
          sortOrder: 3,
        },
      ],
      hasActiveAssignment: true,
      hasMultipleActiveAssignments: true,
    },
  );

  const teamView = createCoachTeamView(coach, "team-a");

  assert.equal(teamView.teamAssignments.length, 2);
  assert.deepEqual(teamView.teamRoleLabels, ["Trainer", "Torwarttrainer"]);
  assert.equal(teamView.teamPrimaryRoleLabel, "Trainer");
  assert.equal(teamView.teamRoleDisplayLabel, "Trainer, Torwarttrainer");
});

test("createCoachTeamView does not leak other-team roles into an assignment without role labels", () => {
  const coach = createCoachReadDto(
    { id: "coach-4", role_de: "Legacy Trainer" },
    {
      assignments: [
        {
          coachTeamSeasonId: "cts-empty",
          teamSeasonId: "ts-1",
          teamId: "team-a",
          teamNameDe: "U17",
          roleDe: null,
          roleEn: null,
          sortOrder: 1,
        },
        {
          coachTeamSeasonId: "cts-other",
          teamSeasonId: "ts-2",
          teamId: "team-b",
          teamNameDe: "U19",
          roleDe: "Betreuer",
          sortOrder: 2,
        },
      ],
      hasActiveAssignment: true,
      hasMultipleActiveAssignments: true,
    },
  );

  const teamView = createCoachTeamView(coach, "team-a");

  assert.deepEqual(teamView.teamRoleLabels, []);
  assert.equal(teamView.teamRoleDisplayLabel, "Rolle offen");
  assert.equal(teamView.teamRoleFallbackUsed, true);
});

test("getCoachImageUrl prefers normalized image fields before the fallback", () => {
  assert.equal(
    getCoachImageUrl(
      { imageUrl: "", image_url: null, photo_url: "https://example.test/a.png" },
      "fallback.png",
    ),
    "https://example.test/a.png",
  );
  assert.equal(getCoachImageUrl({}, "fallback.png"), "fallback.png");
});
