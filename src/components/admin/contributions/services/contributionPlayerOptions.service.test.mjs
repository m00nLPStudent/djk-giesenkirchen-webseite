import test from "node:test";
import assert from "node:assert/strict";

import { loadContributionPlayerOptions } from "./contributionPlayerOptions.service.js";

const PLAYERS = [
  { id: "player-1", first_name: "Anna", last_name: "Becker", is_active: true },
  { id: "player-2", first_name: "Mia", last_name: "Fischer", is_active: true },
];

test("loadContributionPlayerOptions groups assignments per season without player master fallback", async () => {
  const options = await loadContributionPlayerOptions(
    {},
    PLAYERS,
    {
      async loadPlayerAssignmentRows() {
        return [
          {
            id: "pts-1",
            player_id: "player-1",
            team_season_id: "ts-1",
            is_active: true,
            sort_order: 1,
            created_at: "2026-01-01T00:00:00.000Z",
          },
          {
            id: "pts-2",
            player_id: "player-1",
            team_season_id: "ts-2",
            is_active: true,
            sort_order: 2,
            created_at: "2026-01-02T00:00:00.000Z",
          },
        ];
      },
      async loadTeamSeasonRows() {
        return [
          {
            id: "ts-1",
            team_id: "team-1",
            season_id: "season-1",
            name_de: "U17",
            is_active: true,
            sort_order: 1,
          },
          {
            id: "ts-2",
            team_id: "team-2",
            season_id: "season-2",
            name_de: "U19",
            is_active: true,
            sort_order: 2,
          },
        ];
      },
      async loadTeamRows() {
        return [
          { id: "team-1", name_de: "U17", is_active: true },
          { id: "team-2", name_de: "U19", is_active: true },
        ];
      },
    },
  );

  assert.equal(options[0].playerId, "player-1");
  assert.equal(options[0].displayName, "Anna Becker");
  assert.equal(options[0].seasonAssignments.length, 2);
  assert.equal(options[0].primaryAssignmentBySeason["season-1"].teamName, "U17");
  assert.equal(options[1].seasonAssignments.length, 0);
  assert.equal("team_id" in options[0], false);
});

test("loadContributionPlayerOptions avoids N+1 queries", async () => {
  const calls = {
    loadPlayerAssignmentRows: 0,
    loadTeamSeasonRows: 0,
    loadTeamRows: 0,
  };

  await loadContributionPlayerOptions({}, PLAYERS, {
    async loadPlayerAssignmentRows() {
      calls.loadPlayerAssignmentRows += 1;
      return [];
    },
    async loadTeamSeasonRows() {
      calls.loadTeamSeasonRows += 1;
      return [];
    },
    async loadTeamRows() {
      calls.loadTeamRows += 1;
      return [];
    },
  });

  assert.deepEqual(calls, {
    loadPlayerAssignmentRows: 1,
    loadTeamSeasonRows: 1,
    loadTeamRows: 1,
  });
});
