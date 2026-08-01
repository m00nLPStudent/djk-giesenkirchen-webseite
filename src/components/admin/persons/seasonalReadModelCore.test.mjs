import test from "node:test";
import assert from "node:assert/strict";

import {
  CURRENT_SEASON_STATUSES,
  buildCoachAssignments,
  buildCurrentSeasonResolution,
  buildPlayerAssignments,
  createCoachSeasonalReadModelMap,
  createPlayerSeasonalReadModelMap,
} from "./seasonalReadModelCore.mjs";

const resolvedSeason = {
  activeSeasonId: "season-current",
  activeSeasonName: "2026/27",
  activeSeasonStatus: CURRENT_SEASON_STATUSES.RESOLVED,
};

const ambiguousSeason = {
  activeSeasonId: null,
  activeSeasonName: null,
  activeSeasonStatus: CURRENT_SEASON_STATUSES.AMBIGUOUS,
};

const missingSeason = {
  activeSeasonId: null,
  activeSeasonName: null,
  activeSeasonStatus: CURRENT_SEASON_STATUSES.MISSING,
};

const teamSeasonsById = new Map([
  ["ts-current", { id: "ts-current", team_id: "team-a", season_id: "season-current", name_de: "A-Jugend", name_en: "Team A", slug: "team-a" }],
  ["ts-current-b", { id: "ts-current-b", team_id: "team-b", season_id: "season-current", name_de: "B-Jugend", name_en: "Team B", slug: "team-b" }],
  ["ts-old", { id: "ts-old", team_id: "team-old", season_id: "season-old", name_de: "Alt", name_en: "Old", slug: "old-team" }],
]);

const teamsById = new Map([
  ["team-a", { id: "team-a", name_de: "A-Jugend", name_en: "Team A", slug: "team-a" }],
  ["team-b", { id: "team-b", name_de: "B-Jugend", name_en: "Team B", slug: "team-b" }],
  ["team-old", { id: "team-old", name_de: "Alt", name_en: "Old", slug: "old-team" }],
]);

test("buildCurrentSeasonResolution resolves a single current season", () => {
  assert.deepEqual(
    buildCurrentSeasonResolution([{ id: "s1", name: "2026/27", slug: "2026-27" }]),
    {
      activeSeasonId: "s1",
      activeSeasonName: "2026/27",
      activeSeasonSlug: "2026-27",
      activeSeasonStatus: CURRENT_SEASON_STATUSES.RESOLVED,
    },
  );
});

test("buildCurrentSeasonResolution marks missing and ambiguous seasons", () => {
  assert.equal(
    buildCurrentSeasonResolution([]).activeSeasonStatus,
    CURRENT_SEASON_STATUSES.MISSING,
  );
  assert.equal(
    buildCurrentSeasonResolution([{ id: "s1" }, { id: "s2" }]).activeSeasonStatus,
    CURRENT_SEASON_STATUSES.AMBIGUOUS,
  );
});

test("player read-model covers single, none, multiple and historical-only cases", () => {
  const assignmentsByPlayerId = buildPlayerAssignments({
    assignmentRows: [
      { id: "pts-2", player_id: "player-multi", team_season_id: "ts-current-b", shirt_number: 15, position_de: "Sturm", position_en: "Forward", is_captain: false, is_active: true, sort_order: 2, created_at: "2026-08-02" },
      { id: "pts-1", player_id: "player-one", team_season_id: "ts-current", shirt_number: 9, position_de: "Tor", position_en: "Goal", is_captain: true, is_active: true, sort_order: 1, created_at: "2026-08-01" },
      { id: "pts-0", player_id: "player-multi", team_season_id: "ts-current", shirt_number: 8, position_de: "Mittelfeld", position_en: "Midfield", is_captain: true, is_active: true, sort_order: 1, created_at: "2026-08-01" },
      { id: "pts-old", player_id: "player-historical", team_season_id: "ts-old", shirt_number: 4, position_de: "Abwehr", position_en: "Defense", is_captain: false, is_active: true, sort_order: 1, created_at: "2025-08-01" },
    ],
    teamSeasonsById,
    teamsById,
    activeSeasonId: resolvedSeason.activeSeasonId,
    activeSeasonName: resolvedSeason.activeSeasonName,
  });

  const readModels = createPlayerSeasonalReadModelMap({
    playerIds: ["player-one", "player-none", "player-multi", "player-historical", "player-none"],
    seasonResolution: resolvedSeason,
    assignmentsByPlayerId,
  });

  assert.equal(readModels.get("player-one").hasActiveAssignment, true);
  assert.equal(readModels.get("player-one").primaryAssignment.playerTeamSeasonId, "pts-1");
  assert.equal(readModels.get("player-none").assignments.length, 0);
  assert.equal(readModels.get("player-multi").hasMultipleActiveAssignments, true);
  assert.equal(readModels.get("player-multi").primaryAssignment.playerTeamSeasonId, "pts-0");
  assert.equal(readModels.get("player-historical").hasActiveAssignment, false);
});

test("player read-model handles empty ids, missing season and ambiguous season defensively", () => {
  assert.equal(
    createPlayerSeasonalReadModelMap({
      playerIds: [],
      seasonResolution: resolvedSeason,
    }).size,
    0,
  );

  const missingModel = createPlayerSeasonalReadModelMap({
    playerIds: ["player-missing"],
    seasonResolution: missingSeason,
  }).get("player-missing");

  const ambiguousModel = createPlayerSeasonalReadModelMap({
    playerIds: ["player-ambiguous"],
    seasonResolution: ambiguousSeason,
  }).get("player-ambiguous");

  assert.equal(missingModel.activeSeasonStatus, CURRENT_SEASON_STATUSES.MISSING);
  assert.equal(missingModel.hasActiveAssignment, false);
  assert.equal(
    ambiguousModel.activeSeasonStatus,
    CURRENT_SEASON_STATUSES.AMBIGUOUS,
  );
});

test("coach read-model covers single, multiple, none, historical and legacy-only cases", () => {
  const assignmentsByCoachId = buildCoachAssignments({
    assignmentRows: [
      { id: "cts-2", coach_id: "coach-multi", team_season_id: "ts-current-b", role_de: "Betreuer", role_en: "Assistant", is_active: true, sort_order: 2, created_at: "2026-08-02" },
      { id: "cts-1", coach_id: "coach-one", team_season_id: "ts-current", role_de: "Trainer", role_en: "Coach", is_active: true, sort_order: 1, created_at: "2026-08-01" },
      { id: "cts-0", coach_id: "coach-multi", team_season_id: "ts-current", role_de: "Cheftrainer", role_en: "Head Coach", is_active: true, sort_order: 1, created_at: "2026-08-01" },
      { id: "cts-old", coach_id: "coach-historical", team_season_id: "ts-old", role_de: "Alt", role_en: "Old", is_active: true, sort_order: 1, created_at: "2025-08-01" },
    ],
    teamSeasonsById,
    teamsById,
    activeSeasonId: resolvedSeason.activeSeasonId,
    activeSeasonName: resolvedSeason.activeSeasonName,
  });

  const readModels = createCoachSeasonalReadModelMap({
    coachIds: ["coach-one", "coach-none", "coach-multi", "coach-historical", "coach-legacy", "coach-none"],
    seasonResolution: resolvedSeason,
    legacyById: new Map([
      ["coach-legacy", { team_id: "legacy-team", team_name: "Legacy Team" }],
      ["coach-one", { team_id: "legacy-a", team_name: "Legacy A" }],
    ]),
    assignmentsByCoachId,
  });

  assert.equal(readModels.get("coach-one").hasActiveAssignment, true);
  assert.equal(readModels.get("coach-one").primaryAssignment.coachTeamSeasonId, "cts-1");
  assert.equal(readModels.get("coach-none").assignments.length, 0);
  assert.equal(readModels.get("coach-multi").hasMultipleActiveAssignments, true);
  assert.equal(readModels.get("coach-multi").primaryAssignment.coachTeamSeasonId, "cts-0");
  assert.equal(readModels.get("coach-historical").hasActiveAssignment, false);
  assert.equal(readModels.get("coach-legacy").legacyFallbackUsed, true);
  assert.equal(readModels.get("coach-legacy").legacyTeamName, "Legacy Team");
});

test("coach read-model handles empty ids, missing season and ambiguous season defensively", () => {
  assert.equal(
    createCoachSeasonalReadModelMap({
      coachIds: [],
      seasonResolution: resolvedSeason,
    }).size,
    0,
  );

  const missingModel = createCoachSeasonalReadModelMap({
    coachIds: ["coach-missing"],
    seasonResolution: missingSeason,
    legacyById: new Map([["coach-missing", { team_id: "legacy-team", team_name: "Legacy Team" }]]),
  }).get("coach-missing");

  const ambiguousModel = createCoachSeasonalReadModelMap({
    coachIds: ["coach-ambiguous"],
    seasonResolution: ambiguousSeason,
  }).get("coach-ambiguous");

  assert.equal(missingModel.activeSeasonStatus, CURRENT_SEASON_STATUSES.MISSING);
  assert.equal(missingModel.hasActiveAssignment, false);
  assert.equal(missingModel.legacyFallbackUsed, true);
  assert.equal(
    ambiguousModel.activeSeasonStatus,
    CURRENT_SEASON_STATUSES.AMBIGUOUS,
  );
});
