import test from "node:test";
import assert from "node:assert/strict";

import {
  comparePlayersByIdentity,
  filterPlayers,
  getPlayerPositions,
  getPlayerTeams,
  sortPlayersByIdentity,
} from "./playerList.helpers.js";

const players = [
  {
    id: "player-1",
    first_name: "Alex",
    last_name: "Alpha",
    gender: "male",
    nationality: "DE",
    is_active: true,
    assignments: [
      {
        teamId: "team-1",
        teamNameDe: "U17",
        positionDe: "Sturm",
        isCaptain: false,
      },
      {
        teamId: "team-2",
        teamNameDe: "U19",
        positionDe: "Mittelfeld",
        isCaptain: true,
      },
    ],
    primaryAssignment: {
      teamId: "team-1",
      teamNameDe: "U17",
      positionDe: "Sturm",
    },
    teamNames: ["U17", "U19"],
  },
  {
    id: "player-2",
    first_name: "Ben",
    last_name: "Beta",
    gender: "male",
    nationality: "NL",
    is_active: true,
    assignments: [],
    teamNames: [],
  },
];

test("getPlayerTeams exposes every current assignment without duplicates", () => {
  assert.deepEqual(getPlayerTeams(players), [
    { id: "team-1", name: "U17" },
    { id: "team-2", name: "U19" },
  ]);
});

test("getPlayerPositions includes only current assignment positions", () => {
  assert.deepEqual(getPlayerPositions(players), ["Mittelfeld", "Sturm"]);
});

test("filterPlayers matches seasonal team filters and team-name search", () => {
  assert.deepEqual(
    filterPlayers(players, { teamFilter: "team-2" }).map((player) => player.id),
    ["player-1"],
  );

  assert.deepEqual(
    filterPlayers(players, { search: "u19" }).map((player) => player.id),
    ["player-1"],
  );
});

test("filterPlayers can filter by contribution status and overdue state", () => {
  const contributionPlayers = [
    {
      ...players[0],
      contributionStatus: {
        status: "partially_paid",
        isOverdue: false,
      },
    },
    {
      ...players[1],
      contributionStatus: {
        status: "open",
        isOverdue: true,
      },
    },
  ];

  assert.deepEqual(
    filterPlayers(contributionPlayers, { contributionFilter: "partially_paid" }).map((player) => player.id),
    ["player-1"],
  );
  assert.deepEqual(
    filterPlayers(contributionPlayers, { contributionFilter: "overdue" }).map((player) => player.id),
    ["player-2"],
  );
  assert.deepEqual(
    filterPlayers(contributionPlayers, { contributionFilter: "open_cases" }).map((player) => player.id),
    ["player-1", "player-2"],
  );
});

test("sortPlayersByIdentity uses a stable natural global player order without master sort_order", () => {
  const sorted = sortPlayersByIdentity([
    { id: "player-3", first_name: "Ben", last_name: "Alpha" },
    { id: "player-1", first_name: "Alex", last_name: "Alpha" },
    { id: "player-2", first_name: "Alex", last_name: "Alpha" },
  ]);

  assert.deepEqual(
    sorted.map((player) => player.id),
    ["player-1", "player-2", "player-3"],
  );
  assert.ok(comparePlayersByIdentity(sorted[0], sorted[1]) < 0);
});
