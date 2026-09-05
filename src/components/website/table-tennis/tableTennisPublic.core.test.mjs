import test from "node:test";
import assert from "node:assert/strict";

import {
  TABLE_TENNIS_COMPETITION_STATUS,
  applyPublicMediaUrl,
  buildPublicTableTennisTeamHref,
  mergePublicTableTennisSummaries,
  normalizePublicTableTennisTraining,
  normalizePublicTableTennisTeamSlug,
  publicMediaUrlsOrEmpty,
  resolvePublicTableTennisContact,
  resolvePublicTableTennisTeamImage,
  selectCurrentPublicSeason,
  selectPublicTableTennisBoard,
  selectPublicTableTennisCoaches,
  selectPublicTableTennisRoster,
  selectPublicTableTennisTeams,
} from "./tableTennisPublic.core.mjs";

test("current season selection is active-only and deterministic", () => {
  assert.equal(selectCurrentPublicSeason([{ id: "old", name: "2025/2026", is_active: true }, { id: "current", name: "2026/2027", is_active: true, is_current: true }]).id, "current");
  assert.equal(selectCurrentPublicSeason([{ id: "inactive", is_active: false, is_current: true }]), null);
});

test("optional detail and media failures preserve valid team summaries", () => {
  const teams = [{ id: "one", slug: "1 herren", name: "1. Herren" }, { id: "two", slug: "two", name: "2. Herren" }];
  const summaries = mergePublicTableTennisSummaries(teams, [{ data: { training: [{ id: "training" }], contact: null } }, { data: null, error: new Error("optional detail") }]);
  assert.deepEqual(summaries.map((team) => team.id), ["one", "two"]);
  assert.deepEqual(summaries[1].training, []);
  assert.equal(summaries[1].contact, null);
  assert.deepEqual(publicMediaUrlsOrEmpty({ data: new Map([["asset", "url"]]), error: null }).get("asset"), "url");
  assert.equal(publicMediaUrlsOrEmpty({ data: new Map(), error: new Error("optional media") }).size, 0);
  assert.equal(buildPublicTableTennisTeamHref("1 herren"), "/tischtennis/mannschaften/1%20herren");
  assert.equal(normalizePublicTableTennisTeamSlug("1%20herren"), "1 herren");
  assert.equal(normalizePublicTableTennisTeamSlug("1 herren"), "1 herren");
  assert.equal(normalizePublicTableTennisTeamSlug("%E0%A4%A"), null);
  assert.equal(normalizePublicTableTennisTeamSlug("football/team"), null);
});

test("summary merge retains the detail-resolved image for the real list/detail mismatch", () => {
  const teams = [{ id: "team-herren", slug: "1 herren", imageUrl: null }];
  const details = [{ data: { team: { id: "team-herren", imageUrl: "public-season-image" }, training: [], contact: null }, error: null }];
  const [summary] = mergePublicTableTennisSummaries(teams, details);
  assert.equal(summary.imageUrl, "public-season-image");
});

test("team list is current-season, active and strictly department-bound without categories", () => {
  const rows = selectPublicTableTennisTeams({
    departmentId: "tt",
    season: { id: "season", is_active: true },
    teams: [
      { id: "two", name_de: "2. Herren", department_id: "tt", is_active: true, sort_order: 2 },
      { id: "one", name_de: "1. Herren", department_id: "tt", is_active: true, sort_order: 1 },
      { id: "football", department_id: "football", is_active: true },
      { id: "null", department_id: null, is_active: true },
      { id: "inactive", department_id: "tt", is_active: false },
    ],
    teamSeasons: [
      { id: "ts2", team_id: "two", season_id: "season", is_active: true },
      { id: "ts1", team_id: "one", season_id: "season", is_active: true },
      { id: "tsf", team_id: "football", season_id: "season", is_active: true },
      { id: "tsn", team_id: "null", season_id: "season", is_active: true },
      { id: "tsi", team_id: "inactive", season_id: "season", is_active: true },
    ],
  });
  assert.deepEqual(rows.map(({ team }) => team.id), ["one", "two"]);
  assert.equal(selectPublicTableTennisTeams({ departmentId: null, season: { id: "season" } }).length, 0);
});

test("training normalization excludes inactive and out-of-validity rows", () => {
  const base = { id: "t", is_active: true, weekday: 2, start_time: "18:00", end_time: "20:00", training_type: "training", training_location_type: "halle", location_name: "Halle" };
  assert.deepEqual(normalizePublicTableTennisTraining(base, "2026-09-03"), { id: "t", weekday: 2, startTime: "18:00", endTime: "20:00", trainingType: "training", locationType: "halle", locationName: "Halle", locationAddress: null, locationCity: null, effectiveFrom: null, effectiveUntil: null });
  assert.equal(normalizePublicTableTennisTraining({ ...base, is_active: false }, "2026-09-03"), null);
  assert.equal(normalizePublicTableTennisTraining({ ...base, effective_from: "2026-09-04" }, "2026-09-03"), null);
  assert.equal(normalizePublicTableTennisTraining({ ...base, effective_until: "2026-09-02" }, "2026-09-03"), null);
});

test("roster excludes football, null-department, inactive and duplicate players and omits football fields", () => {
  const assignment = (id, department_id, overrides = {}) => ({ id, is_active: true, sort_order: 1, players: { id, first_name: id, last_name: "Spieler", department_id, is_active: true, shirt_number: 8, position_de: "Sturm", strong_foot: "Rechts", strong_hand: "Links", ...overrides } });
  const roster = selectPublicTableTennisRoster([assignment("tt", "tt"), assignment("football", "football"), assignment("null", null), assignment("inactive", "tt", { is_active: false }), assignment("tt", "tt")], "tt");
  assert.deepEqual(roster.map((item) => item.id), ["tt"]);
  assert.equal(roster[0].strongHand, "Links");
  assert.equal("shirt_number" in roster[0], false);
  assert.equal("position_de" in roster[0], false);
  assert.equal("strong_foot" in roster[0], false);
});

test("coach selection excludes cross-department and inactive assignments", () => {
  const coaches = selectPublicTableTennisCoaches([
    { is_active: true, role_de: "Trainer", coaches: { id: "tt", name: "TT", department_id: "tt", is_active: true } },
    { is_active: true, coaches: { id: "football", name: "Football", department_id: "football", is_active: true } },
    { is_active: false, coaches: { id: "inactive", department_id: "tt", is_active: true } },
  ], "tt");
  assert.deepEqual(coaches.map((item) => item.id), ["tt"]);
});

test("board selection excludes club, football, unassigned and inactive rows", () => {
  const board = selectPublicTableTennisBoard([
    { id: "tt", first_name: "TT", organization_scope: "department", department_id: "tt", is_active: true, sort_order: 2 },
    { id: "club", organization_scope: "club", department_id: null, is_active: true },
    { id: "football", organization_scope: "department", department_id: "football", is_active: true },
    { id: "unassigned", organization_scope: "unassigned", department_id: null, is_active: true },
    { id: "inactive", organization_scope: "department", department_id: "tt", is_active: false },
  ], "tt");
  assert.deepEqual(board.map((item) => item.id), ["tt"]);
});

test("contact is exclusively resolved from the explicit team contact", () => {
  const board = [{ id: "board", email: "board@example.test" }];
  const coaches = [{ id: "coach", phone: "123" }];
  assert.equal(resolvePublicTableTennisContact({ team: { contact_name: "Team", contact_email: "team@example.test" }, coaches, board }).source, "team");
  assert.equal(resolvePublicTableTennisContact({ team: {}, coaches, board }), null);
  assert.equal(resolvePublicTableTennisContact({ team: {}, coaches: [], board }), null);
  assert.equal(resolvePublicTableTennisContact({ team: {}, coaches: [], board: [] }), null);
});

test("central media references fail closed while legacy-only images remain compatible", () => {
  assert.equal(applyPublicMediaUrl({ imageMediaAssetId: "public", legacyImageUrl: "legacy" }, new Map([["public", "public-url"]])).imageUrl, "public-url");
  assert.equal(applyPublicMediaUrl({ imageMediaAssetId: "admin", legacyImageUrl: "legacy" }, new Map()).imageUrl, null);
  assert.equal(applyPublicMediaUrl({ imageMediaAssetId: null, legacyImageUrl: "legacy" }, new Map()).imageUrl, "legacy");
  assert.equal(resolvePublicTableTennisTeamImage({ team: { team_image_media_asset_id: "admin", team_image_url: "legacy" }, mediaUrls: new Map() }), null);
  assert.equal(resolvePublicTableTennisTeamImage({ team: { team_image_url: "legacy" }, mediaUrls: new Map() }), "legacy");
});

test("list and detail share the same seasonal team image priority", () => {
  const team = { team_image_media_asset_id: "team-media", team_image_url: "team-legacy" };
  const teamSeason = { team_image_media_asset_id: "season-media", team_image_url: "season-legacy" };
  const mediaUrls = new Map([["season-media", "season-public"], ["team-media", "team-public"]]);
  const listImage = resolvePublicTableTennisTeamImage({ team, teamSeason, mediaUrls });
  const detailImage = resolvePublicTableTennisTeamImage({ team, teamSeason, mediaUrls });
  assert.equal(listImage, "season-public");
  assert.equal(detailImage, listImage);
});

test("competition contract is neutral and explicitly deferred", () => {
  assert.equal(TABLE_TENNIS_COMPETITION_STATUS, "external_integration_deferred");
});
