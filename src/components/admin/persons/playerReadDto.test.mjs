import test from "node:test";
import assert from "node:assert/strict";

import { createPlayerReadDto, getPlayerImageUrl } from "./playerReadDto.js";

test("createPlayerReadDto maps seasonal assignments into the shared player dto", () => {
  const dto = createPlayerReadDto(
    {
      id: "player-1",
      first_name: "Alex",
      last_name: "Beispiel",
      image_url: "https://example.test/player.png",
      is_active: true,
      shirt_number: 99,
      position_de: "Alt",
      is_captain: false,
      year_group: "2009",
      strong_hand: "Rechts",
    },
    {
      assignments: [
        {
          playerTeamSeasonId: "pts-2",
          teamSeasonId: "ts-2",
          teamId: "team-2",
          teamNameDe: "U19",
          teamSlug: "u19",
          seasonId: "season-1",
          seasonName: "2026/27",
          shirtNumber: 10,
          positionDe: "Sturm",
          isCaptain: true,
          sortOrder: 2,
          isActive: true,
          ageGroup: "Jugend",
        },
        {
          playerTeamSeasonId: "pts-1",
          teamSeasonId: "ts-1",
          teamId: "team-1",
          teamNameDe: "U17",
          teamSlug: "u17",
          seasonId: "season-1",
          seasonName: "2026/27",
          shirtNumber: 8,
          positionDe: "Mittelfeld",
          isCaptain: false,
          sortOrder: 1,
          isActive: true,
          ageGroup: "Jugend",
        },
      ],
      hasActiveAssignment: true,
      hasMultipleActiveAssignments: true,
      activeSeasonStatus: "CURRENT_SEASON_RESOLVED",
    },
  );

  assert.equal(dto.playerId, "player-1");
  assert.equal(dto.displayName, "Alex Beispiel");
  assert.equal(dto.imageUrl, "https://example.test/player.png");
  assert.equal(dto.primaryAssignment.playerTeamSeasonId, "pts-1");
  assert.deepEqual(dto.teamNames, ["U17", "U19"]);
  assert.equal(dto.primaryTeamName, "U17");
  assert.equal(dto.teams.slug, "u17");
  assert.equal(dto.shirtNumber, 8);
  assert.equal(dto.positionDe, "Mittelfeld");
  assert.equal(dto.isCaptain, false);
  assert.equal(dto.hasMultipleActiveAssignments, true);
  assert.equal(dto.strongHand, "Rechts");
});

test("createPlayerReadDto does not synthesize current-season values from player snapshots", () => {
  const dto = createPlayerReadDto(
    {
      id: "player-2",
      first_name: "Sam",
      last_name: "Snapshot",
      photo_url: "https://example.test/legacy.png",
      shirt_number: 5,
      position_de: "Abwehr",
      is_captain: true,
      is_active: false,
    },
    {
      assignments: [],
      hasActiveAssignment: false,
      activeSeasonStatus: "CURRENT_SEASON_MISSING",
    },
  );

    assert.equal(dto.imageUrl, "https://example.test/legacy.png");
  assert.equal(dto.teams, null);
  assert.equal(dto.primaryTeamName, "Keine Mannschaft");
  assert.equal(dto.shirtNumber, null);
  assert.equal(dto.positionDe, "");
  assert.equal(dto.positionEn, "");
  assert.equal(dto.isCaptain, false);
  assert.equal(dto.isActive, false);
});

test("getPlayerImageUrl keeps canonical image fields ahead of photo_url", () => {
  assert.equal(
    getPlayerImageUrl({
      imageUrl: "https://example.test/normalized.png",
      image_url: "https://example.test/canonical.png",
      photo_url: "https://example.test/legacy.png",
    }),
    "https://example.test/normalized.png",
  );
});
