import test from "node:test";
import assert from "node:assert/strict";

import { mapTeamRosterPlayers } from "./teamRoster.core.mjs";

test("mapTeamRosterPlayers keeps current assignment data and ignores player master snapshots", () => {
  const players = mapTeamRosterPlayers([
    {
      shirt_number: null,
      position_de: "",
      position_en: "",
      is_captain: false,
      sort_order: 2,
      players: {
        id: "player-1",
        first_name: "Alex",
        shirt_number: 10,
        position_de: "Legacy",
        position_en: "Legacy",
        is_captain: true,
        sort_order: 9,
        is_active: true,
      },
    },
  ]);

  assert.deepEqual(players, [
    {
      id: "player-1",
      first_name: "Alex",
      shirt_number: null,
      position_de: "",
      position_en: "",
      is_captain: false,
      sort_order: 2,
      is_active: true,
    },
  ]);
});

test("mapTeamRosterPlayers skips inactive and duplicate players", () => {
  const players = mapTeamRosterPlayers([
    {
      shirt_number: 7,
      position_de: "Sturm",
      is_captain: true,
      sort_order: 1,
      players: { id: "player-1", first_name: "Alex", is_active: true },
    },
    {
      shirt_number: 9,
      position_de: "Abwehr",
      is_captain: false,
      sort_order: 2,
      players: { id: "player-1", first_name: "Alex", is_active: true },
    },
    {
      shirt_number: 4,
      position_de: "Tor",
      is_captain: false,
      sort_order: 3,
      players: { id: "player-2", first_name: "Ben", is_active: false },
    },
  ]);

  assert.equal(players.length, 1);
  assert.equal(players[0].id, "player-1");
  assert.equal(players[0].shirt_number, 7);
});
