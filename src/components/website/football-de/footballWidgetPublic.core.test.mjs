import assert from "node:assert/strict";
import test from "node:test";
import { selectConfiguredFootballWidgetTeams } from "./footballWidgetPublic.core.mjs";

test("selects only configured active football teams in the current season", () => {
  const teams = [
    { id: "a", slug: "a", name_de: "Team A", department_id: "football", is_active: true, sort_order: 2 },
    { id: "b", slug: "b", name_de: "Team B", department_id: "football", is_active: true, sort_order: 1 },
    { id: "c", slug: "c", name_de: "Team C", department_id: "football", is_active: true },
    { id: "x", slug: "x", name_de: "Fremd", department_id: "other", is_active: true },
  ];
  const teamSeasons = [
    { team_id: "a", season_id: "current", is_active: true, fussball_de_matches_widget_id: "matches-a" },
    { team_id: "b", season_id: "current", is_active: true, fussball_de_table_widget_id: "table-b" },
    { team_id: "c", season_id: "old", is_active: true, fussball_de_table_widget_id: "old-table" },
    { team_id: "x", season_id: "current", is_active: true, fussball_de_table_widget_id: "foreign" },
  ];
  assert.deepEqual(selectConfiguredFootballWidgetTeams({ teams, teamSeasons, departmentId: "football", seasonId: "current" }), [
    { slug: "b", name: "Team B", fussball_de_matches_widget_id: null, fussball_de_table_widget_id: "table-b" },
    { slug: "a", name: "Team A", fussball_de_matches_widget_id: "matches-a", fussball_de_table_widget_id: null },
  ]);
});
