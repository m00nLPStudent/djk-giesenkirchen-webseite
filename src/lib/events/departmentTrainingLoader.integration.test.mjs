import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const loader = readFileSync(new URL("./departmentTrainingLoader.js", import.meta.url), "utf8");
const home = readFileSync(new URL("../../app/(website)/page.js", import.meta.url), "utf8");
const card = readFileSync(new URL("../../components/website/events/HomeEventsSection.js", import.meta.url), "utf8");

test("department training loader is server-only, RLS-bound and independent of contact and media", () => {
  assert.match(loader, /import "server-only"/);
  for (const table of ["department_training_times", "departments", "department_sections", "club_closure_periods"]) {
    assert.match(loader, new RegExp(`from\\("${table}"\\)`));
  }
  assert.match(loader, /getTrainingOccurrences/);
  assert.match(loader, /applyClubClosurePeriods/);
  assert.doesNotMatch(loader, /createSupabaseAdminClient|service[_-]?role|media_assets|image_media_asset_id|contact_/i);
});

test("homepage merges both occurrence sources before applying its unchanged limit", () => {
  const teamLoad = home.indexOf("getVirtualTrainingEvents(trainingWindow)");
  const departmentLoad = home.indexOf("getPublicDepartmentTrainingEvents(trainingWindow)");
  const merge = home.indexOf("mergeTrainingOccurrenceStreams(teamTrainingEvents, departmentTrainingEvents)");
  const limit = home.indexOf("selectUpcomingHomeTrainings(trainingEvents");

  assert.ok(teamLoad >= 0 && departmentLoad >= 0);
  assert.ok(teamLoad < merge && departmentLoad < merge && merge < limit);
  assert.match(home, /export const dynamic = "force-dynamic"/);
  assert.match(home, /maxOccurrencesPerTraining: 180/);
});

test("existing home card handles department occurrences without a parallel UI", () => {
  assert.match(card, /event\.source_type === "department_training"/);
  assert.match(card, /event\.department_href/);
  assert.match(card, /event\.team_name_de \|\| event\.title_de/);
  assert.match(card, /TrainingSportIcon event=\{event\}/);
});
