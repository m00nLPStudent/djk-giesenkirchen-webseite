import test from "node:test";
import assert from "node:assert/strict";
import {
  filterCoachesByStats,
  getCoachStats,
  getUniqueAssignedTeams,
} from "./coachStats.js";

const COACHES = [
  {
    id: "coach-a",
    primaryRoleLabel: "Trainer",
    roleLabels: ["Trainer", "Torwarttrainer", "Betreuer"],
    assignments: [
      {
        teamId: "team-1",
        teamNameDe: "U17",
        roleDe: "Trainer",
        sortOrder: 1,
      },
      {
        teamId: "team-1",
        teamNameDe: "U17",
        roleDe: "Torwarttrainer",
        sortOrder: 2,
      },
      {
        teamId: "team-2",
        teamNameDe: "U19",
        roleDe: "Betreuer",
        sortOrder: 3,
      },
    ],
  },
  {
    id: "coach-b",
    primaryRoleLabel: "Co-Trainer",
    roleLabels: ["Co-Trainer"],
    assignments: [
      {
        teamId: "team-2",
        teamNameDe: "U19",
        roleDe: "Co-Trainer",
        sortOrder: 1,
      },
    ],
  },
  {
    id: "coach-c",
    primaryRoleLabel: "Trainer",
    roleLabels: ["Trainer"],
    assignments: [],
  },
];

test("getCoachStats counts unique teams and assignment-derived roles", () => {
  const stats = getCoachStats(COACHES);

  assert.equal(stats.trainer, 2);
  assert.equal(stats.coTrainer, 1);
  assert.equal(stats.supervisors, 1);
  assert.equal(stats.teams, 2);
});

test("getUniqueAssignedTeams keeps one coach entry per team", () => {
  const teams = getUniqueAssignedTeams(COACHES);
  const u19 = teams.find((team) => team.id === "team-2");

  assert.equal(teams.length, 2);
  assert.equal(u19.coaches.length, 2);
});

test("filterCoachesByStats handles multi-team and unassigned coaches cleanly", () => {
  assert.deepEqual(
    filterCoachesByStats(COACHES, "mannschaften").map((coach) => coach.id),
    ["coach-a", "coach-b"],
  );
  assert.deepEqual(
    filterCoachesByStats(COACHES, "co-trainer").map((coach) => coach.id),
    ["coach-b"],
  );
});
