import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const helperUrl = new URL("./eventList.helpers.js", import.meta.url);
const helperSource = fs.readFileSync(helperUrl, "utf8").replace('import { getEventStatusKey } from "@/lib/events";', 'const getEventStatusKey = (item, now) => !item.is_published ? "entwurf" : new Date(item.starts_at) > now ? "geplant" : "veroeffentlicht";');
const helperModule = await import(`data:text/javascript;base64,${Buffer.from(helperSource).toString("base64")}`);
const { filterAdminEventList, getAdminEventSummary, getNextCalendarDayWindow, prepareAdminEventList } = helperModule;

const now = new Date(2026, 7, 2, 10, 0, 0);
const club = [
  { id: "published", title_de: "Sommerfest", starts_at: new Date(2026, 7, 1, 10).toISOString(), is_published: true },
  { id: "planned", title_de: "Mitgliederversammlung", starts_at: new Date(2026, 7, 8, 10).toISOString(), is_published: true },
  { id: "draft", title_de: "Entwurf", starts_at: new Date(2026, 7, 9, 10).toISOString(), is_published: false },
];
const training = (id, hour = 18) => ({ occurrence_id: id, title_de: `Training ${id}`, starts_at: new Date(2026, 7, 3, hour).toISOString(), team_name_de: id, team_season_name: "2026/27" });

test("the loader window targets exactly the next local calendar day", () => {
  const window = getNextCalendarDayWindow(now);
  assert.equal(window.from.getFullYear(), 2026);
  assert.equal(window.from.getMonth(), 7);
  assert.equal(window.from.getDate(), 3);
  assert.equal(window.from.getHours(), 0);
  assert.equal(window.to.getTime(), window.from.getTime());
});

test("no training tomorrow keeps all club dates unchanged", () => {
  const result = prepareAdminEventList(club, [], now);
  assert.deepEqual(result.map((item) => item.id), ["published", "planned", "draft"]);
  assert.equal(getAdminEventSummary(result).trainingTomorrow, 0);
});

test("one training tomorrow is merged and counted once", () => {
  const result = prepareAdminEventList(club, [training("E1")], now);
  assert.equal(result.filter((item) => item.admin_source === "mannschaft").length, 1);
  assert.equal(getAdminEventSummary(result).trainingTomorrow, 1);
});

test("multiple trainings tomorrow are merged and counted", () => {
  const result = prepareAdminEventList(club, [training("E1"), training("E2", 19), training("D2", 17)], now);
  assert.equal(getAdminEventSummary(result).trainingTomorrow, 3);
  assert.deepEqual(result.filter((item) => item.admin_source === "verein").map((item) => item.id), ["published", "planned", "draft"]);
});

test("summary status values describe club dates and training tomorrow separately", () => {
  const result = prepareAdminEventList(club, [training("E1"), training("E2")], now);
  assert.deepEqual(getAdminEventSummary(result), { published: 1, planned: 1, drafts: 1, trainingTomorrow: 2 });
});

test("source, status and search filters stay unchanged", () => {
  const result = prepareAdminEventList(club, [training("E1")], now);
  assert.deepEqual(filterAdminEventList(result, { source: "verein" }).map((item) => item.id), ["published", "planned", "draft"]);
  assert.deepEqual(filterAdminEventList(result, { source: "mannschaft", status: "geplant" }).map((item) => item.occurrence_id), ["E1"]);
  assert.deepEqual(filterAdminEventList(result, { search: "2026/27" }).map((item) => item.occurrence_id), ["E1"]);
});
