import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("football public people pages remain active and department scoped", async () => {
  const [coaches, board] = await Promise.all([
    read("../../../app/(website)/fussball/abteilung/trainer/page.js"),
    read("../../../app/(website)/fussball/abteilung/vorstand/page.js"),
  ]);
  assert.match(coaches, /dynamic = "force-dynamic"/);
  assert.match(coaches, /loadActivePublicCoachDtos\(supabase, \{ departmentId: footballDepartment\.id \}\)/);
  assert.match(coaches, /eq\("slug", "fussball"\)[\s\S]*eq\("is_active", true\)/);
  assert.match(board, /dynamic = "force-dynamic"/);
  assert.match(board, /eq\("organization_scope", "department"\)[\s\S]*eq\("department_id", footballDepartment\.id\)[\s\S]*eq\("is_active", true\)[\s\S]*order\("sort_order"/);
  assert.doesNotMatch(board, /\.select\("\*/);
});

test("football teams and detail resolve only the saved football department", async () => {
  const [teams, detail] = await Promise.all([
    read("../../../lib/football/teams.js"),
    read("../../../app/(website)/fussball/[slug]/page.js"),
  ]);
  assert.match(teams, /eq\("department_id", departmentId\)[\s\S]*eq\("is_active", true\)/);
  assert.match(detail, /eq\("slug", slug\)[\s\S]*eq\("department_id", footballDepartment\.id\)[\s\S]*eq\("is_active", true\)[\s\S]*maybeSingle/);
  assert.match(detail, /if \(!team\?\.id\) notFound\(\)/);
});

test("football navigation and training route use the dedicated scoped path", async () => {
  const [menu, navigation, route, tableTennisRoute, detail, loader, scope] = await Promise.all([
    read("../navigation/footballMenu.js"),
    read("../navigation/navigationConfig.js"),
    read("../../../app/(website)/fussball/trainingszeiten/page.js"),
    read("../../../app/(website)/tischtennis/trainingszeiten/page.js"),
    read("../../../app/(website)/termine/training/[occurrenceId]/page.js"),
    read("../../../lib/events/eventLoader.js"),
    read("../../../lib/events/publicTrainingScope.core.mjs"),
  ]);
  assert.match(menu, /Trainingszeiten[\s\S]*\/fussball\/trainingszeiten/);
  assert.match(navigation, /Trainingszeiten", href: "\/fussball\/trainingszeiten"/);
  assert.match(route, /selectTeamTrainingForDepartment\(loaded, "fussball"\)/);
  assert.match(route, /Heute & Morgen|TrainingEventsOverview/);
  assert.match(tableTennisRoute, /selectTeamTrainingForDepartment\(loaded, "tischtennis"\)/);
  assert.match(tableTennisRoute, /basePath="\/tischtennis\/trainingszeiten"/);
  assert.match(tableTennisRoute, /TrainingEventsOverview/);
  assert.match(loader, /team_name_de: slot\.team_name_de \|\| team\?\.name_de/);
  assert.match(loader, /department_slug: team\?\.departments\?\.slug/);
  assert.match(scope, /normalizedSlug\(event\.department_slug\) === expectedSlug/);
  assert.doesNotMatch(scope, /normalizedSlug\(event\.team_slug\)/);
  assert.doesNotMatch(loader, /season_is_current|activeSeason/);
  assert.match(detail, /resolveTrainingOwnerLink\(event\)/);
  assert.doesNotMatch(detail, /`\/fussball\/\$\{event\.team_slug\}`/);
});
