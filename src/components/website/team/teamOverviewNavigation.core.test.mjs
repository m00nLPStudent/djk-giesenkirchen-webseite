import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveFootballTeamOverviewRoute,
  TABLE_TENNIS_TEAM_OVERVIEW_ROUTE,
} from "./teamOverviewNavigation.core.mjs";

test("football overview routes derive only from the structured age group", () => {
  assert.equal(
    resolveFootballTeamOverviewRoute({ age_group: "Jugend", name_de: "1. Herren" }),
    "/fussball/mannschaften/junioren",
  );
  assert.equal(
    resolveFootballTeamOverviewRoute({ age_group: "Senioren", name_de: "Damen" }),
    "/fussball/mannschaften/senioren",
  );
  assert.equal(
    resolveFootballTeamOverviewRoute({ age_group: "Frauen", name_de: "A-Jugend" }),
    "/fussball/mannschaften/damen",
  );
});

test("unknown football classifications fail safely to the canonical team index", () => {
  assert.equal(
    resolveFootballTeamOverviewRoute({ age_group: "" }),
    "/fussball/mannschaften",
  );
});

test("table tennis uses its canonical public team overview", () => {
  assert.equal(TABLE_TENNIS_TEAM_OVERVIEW_ROUTE, "/tischtennis/mannschaften");
});
