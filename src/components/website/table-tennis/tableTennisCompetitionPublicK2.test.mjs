import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { selectConfiguredCompetitionOptions, selectPublicTableTennisTeams } from "./tableTennisPublic.core.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

test("current TT team seasons map to their own active provider configs", () => {
  const season = { id: "current", is_active: true, is_current: true };
  const rows = selectPublicTableTennisTeams({ departmentId: "tt", season, teams: [
    { id: "a", slug: "team-a", name_de: "Team A", department_id: "tt", is_active: true, sort_order: 1 },
    { id: "b", slug: "team-b", name_de: "Team B", department_id: "tt", is_active: true, sort_order: 2 },
    { id: "football", slug: "football", name_de: "Football", department_id: "fb", is_active: true },
  ], teamSeasons: [
    { id: "tsa", team_id: "a", season_id: "current", name_de: "Team A", is_active: true },
    { id: "tsb", team_id: "b", season_id: "current", name_de: "Team B", is_active: true },
    { id: "old", team_id: "a", season_id: "old", is_active: true },
  ] });
  const options = selectConfiguredCompetitionOptions(rows, [
    { team_season_id: "tsa", external_group_id: "1", external_team_id: "10", is_active: true },
    { team_season_id: "tsb", external_group_id: "2", external_team_id: "20", is_active: true },
    { team_season_id: "old", external_group_id: "old", external_team_id: "old", is_active: true },
  ]);
  assert.deepEqual(options.map((item) => [item.slug, item.config.external_group_id]), [["team-a", "1"], ["team-b", "2"]]);
});

test("inactive and unconfigured teams stay out of public selection", () => {
  const rows = [{ team: { slug: "a", name_de: "A" }, teamSeason: { id: "a" } }, { team: { slug: "b", name_de: "B" }, teamSeason: { id: "b" } }];
  assert.deepEqual(selectConfiguredCompetitionOptions(rows, [{ team_season_id: "a", is_active: false }]), []);
});

test("public route changes table and schedule through one selected slug", () => {
  const page = read("../../../app/(website)/tischtennis/spielplan-tabelle/page.js");
  assert.match(page, /query\?\.team/);
  assert.match(page, /loadPublicTableTennisCompetitionBySlug\(selected\.slug/);
  assert.match(page, /preloadedOptions: options/);
  assert.match(page, /aria-current=/);
  assert.match(page, /dynamic = "force-dynamic"/);
});

test("competition UI is semantic, responsive, attributed and independently fallible", () => {
  const view = read("TableTennisCompetitionView.js");
  const provider = read("../../../lib/table-tennis/clickTt.server.js");
  assert.match(view, /<table/);
  assert.match(view, /overflow-x-auto/);
  assert.match(view, /<ul/);
  assert.match(view, /<article/);
  assert.match(view, /Unsere Mannschaft/);
  assert.match(view, /competition\.tableError/);
  assert.match(view, /competition\.scheduleError/);
  assert.match(view, /Daten:/);
  assert.match(provider, /Promise\.all\(\[fetchHtml\(tableUrl/);
  assert.match(provider, /status: availableParts === 2 \? "available" : availableParts === 1 \? "partial"/);
  assert.match(provider, /tableError:/);
  assert.match(provider, /scheduleError:/);
});

test("team detail uses the shared competition view and a neutral unconfigured state", () => {
  const tabs = read("TableTennisTeamDetailTabs.js");
  const view = read("TableTennisCompetitionView.js");
  assert.match(tabs, /TableTennisCompetitionView competition=\{competition\}/);
  assert.match(view, /keine Spielbetriebsintegration hinterlegt/);
});
