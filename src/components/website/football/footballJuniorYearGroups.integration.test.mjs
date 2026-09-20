import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [juniorPage, seniorPage, womenPage, card, repository, teams] = await Promise.all([
  read("../../../app/(website)/fussball/mannschaften/junioren/page.js"),
  read("../../../app/(website)/fussball/mannschaften/senioren/page.js"),
  read("../../../app/(website)/fussball/mannschaften/damen/page.js"),
  read("./FootballTeamCard.js"),
  read("../../../lib/football/juniorTeamYearGroups.repository.js"),
  read("../../../lib/football/teams.js"),
]);

test("junior cards load central mappings server-side for resolved current-season rows", () => {
  assert.match(juniorPage, /createSupabaseAdminClient/);
  assert.match(juniorPage, /team\.team_season_id/);
  assert.match(juniorPage, /loadJuniorTeamYearGroups/);
  assert.match(juniorPage, /attachJuniorTeamBirthYears/);
  assert.match(juniorPage, /detail="birth-years"/);
  assert.match(repository, /import "server-only"/);
  assert.match(repository, /from\("team_season_year_groups"\)/);
  assert.match(repository, /select\("team_season_id, birth_year"\)/);
  assert.match(teams, /season\.is_current/);
  assert.doesNotMatch(juniorPage, /2026|2027/);
});

test("only the junior overview opts into year groups", () => {
  assert.doesNotMatch(seniorPage, /birth-years|loadJuniorTeamYearGroups/);
  assert.doesNotMatch(womenPage, /birth-years|loadJuniorTeamYearGroups/);
  assert.match(card, /detail === "birth-years"/);
  assert.match(card, /team\.training_times_de \|\| "Trainingszeiten folgen\."/);
});

test("the shared card keeps links, images and category presentation intact", () => {
  assert.match(card, /href=\{`\/fussball\/\$\{team\.slug\}`\}/);
  assert.match(card, /team\.team_image_url/);
  assert.match(card, /team\.age_group \|\| "Mannschaft"/);
  assert.match(card, /formatTeamBirthYears/);
});
