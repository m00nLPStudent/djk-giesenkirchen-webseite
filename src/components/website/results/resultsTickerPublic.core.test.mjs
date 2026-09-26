import test from "node:test";
import assert from "node:assert/strict";
import { createPublicResultDto, createPublicResultDtos, isPublicResultVisible } from "./resultsTickerPublic.core.mjs";
import { filterResultsForRouteContext, resolveResultsTickerRouteContext } from "./resultsTickerRouteContext.mjs";

const row = (overrides = {}) => ({
  id: "00000000-0000-4000-8000-000000000001",
  played_at: "2026-09-27T12:00:00.000Z",
  visible_from: null,
  visible_until: null,
  is_published: true,
  club_is_home: true,
  opponent_name: "Beispielverein",
  club_score: 3,
  opponent_score: 1,
  opponent_logo_media_asset_id: "logo-1",
  competition_label: "Liga",
  team_seasons: { id: "ts-1", name_de: "1. Herren", is_active: true, sort_order: 2, teams: { id: "team-1", name_de: "Herren", is_active: true, sort_order: 1, departments: { slug: "fussball", is_active: true } } },
  ...overrides,
});

test("home and away mappings place scores and logos on the correct side", () => {
  const home = createPublicResultDto(row(), "https://example.test/opponent.png");
  assert.equal(home.homeScore, 3);
  assert.equal(home.awayScore, 1);
  assert.match(home.homeLogoUrl, /club-logo/);
  assert.equal(home.awayLogoUrl, "https://example.test/opponent.png");

  const away = createPublicResultDto(row({ club_is_home: false }), "https://example.test/opponent.png");
  assert.equal(away.homeName, "Beispielverein");
  assert.equal(away.homeScore, 1);
  assert.equal(away.awayScore, 3);
  assert.equal(away.homeLogoUrl, "https://example.test/opponent.png");
  assert.match(away.awayLogoUrl, /club-logo/);
});

test("missing opponent logo remains a neutral client fallback contract", () => {
  const dto = createPublicResultDto(row(), null);
  assert.equal(dto.awayLogoUrl, null);
});

test("visibility supports seven-day default and an explicit override", () => {
  assert.equal(isPublicResultVisible(row(), new Date("2026-10-04T11:59:59Z")), true);
  assert.equal(isPublicResultVisible(row(), new Date("2026-10-04T12:00:00Z")), false);
  assert.equal(isPublicResultVisible(row({ visible_from: "2026-10-05T10:00:00Z", visible_until: "2026-10-06T10:00:00Z" }), new Date("2026-10-05T12:00:00Z")), true);
  assert.equal(isPublicResultVisible(row({ is_published: false }), new Date("2026-09-28T12:00:00Z")), false);
});

test("public sorting is deterministic by sport, team, team season, time and id", () => {
  const rows = [
    row({ id: "b", team_seasons: { ...row().team_seasons, sort_order: 3, teams: { ...row().team_seasons.teams, sort_order: 2, departments: { slug: "fussball" } } } }),
    row({ id: "c", team_seasons: { ...row().team_seasons, teams: { ...row().team_seasons.teams, departments: { slug: "tischtennis" } } } }),
    row({ id: "a", played_at: "2026-09-28T12:00:00Z" }),
  ];
  assert.deepEqual(createPublicResultDtos(rows).map((item) => item.id), ["a", "b", "c"]);
});

test("route context follows real football, table-tennis and hidden prefixes", () => {
  assert.equal(resolveResultsTickerRouteContext("/fussball/mannschaften"), "football");
  assert.equal(resolveResultsTickerRouteContext("/tischtennis/spielplan-tabelle"), "table-tennis");
  assert.equal(resolveResultsTickerRouteContext("/damen-gymnastik"), "hidden");
  assert.equal(resolveResultsTickerRouteContext("/behindertensport/angebot"), "hidden");
  assert.equal(resolveResultsTickerRouteContext("/verein/vorstand"), "mixed");
  assert.equal(resolveResultsTickerRouteContext("/unbekannt"), "mixed");
});

test("route filtering never mixes department contexts", () => {
  const results = [{ departmentSlug: "fussball" }, { departmentSlug: "tischtennis" }];
  assert.equal(filterResultsForRouteContext(results, "football").length, 1);
  assert.equal(filterResultsForRouteContext(results, "table-tennis").length, 1);
  assert.equal(filterResultsForRouteContext(results, "mixed").length, 2);
  assert.equal(filterResultsForRouteContext(results, "hidden").length, 0);
});
