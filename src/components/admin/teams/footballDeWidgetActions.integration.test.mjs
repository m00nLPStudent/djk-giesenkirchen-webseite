import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const actionsPath = new URL("../../../app/admin/teams/actions.js", import.meta.url);
const fieldsPath = new URL("./forms/fields/TeamFootballDeFields.js", import.meta.url);

test("widget mutations remain permission, football department and team-season scoped", async () => {
  const source = await readFile(actionsPath, "utf8");
  assert.match(source, /loadAuthorizedTeamMutationContext\("teams\.edit"\)/);
  assert.match(source, /canAccessTeamOnServer\(auth\.scopeContext, team\)/);
  assert.match(source, /department\.slug !== "fussball"/);
  assert.match(source, /\.eq\("id", teamSeasonId\)\.eq\("team_id", team\.id\)/);
  assert.match(source, /validateFootballDeWidgetCode\(widgetCode, kind\)/);
  assert.match(source, /update\(\{ \[column\]: validation\.data\.widgetId \}\)/);
});

test("editor exposes separate replace and remove actions for both widget types", async () => {
  const source = await readFile(fieldsPath, "utf8");
  assert.match(source, /Spielplan ersetzen/);
  assert.match(source, /Spielplan entfernen/);
  assert.match(source, /Tabelle ersetzen/);
  assert.match(source, /Tabelle entfernen/);
  assert.match(source, /type="button"/);
});
