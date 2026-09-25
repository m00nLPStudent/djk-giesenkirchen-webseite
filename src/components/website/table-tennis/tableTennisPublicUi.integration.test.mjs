import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const ui = read("./TableTennisPublicUi.js");
const landing = read("../../../app/(website)/tischtennis/page.js");
const teams = read("../../../app/(website)/tischtennis/mannschaften/page.js");
const detail = read("../../../app/(website)/tischtennis/mannschaften/[slug]/page.js");
const training = read("../../../app/(website)/tischtennis/trainingszeiten/page.js");
const board = read("../../../app/(website)/tischtennis/vorstand/page.js");
const competition = read("../../../app/(website)/tischtennis/spielplan-tabelle/page.js");
const repository = read("./tableTennisPublic.repository.js");
const detailTabs = read("./TableTennisTeamDetailTabs.js");
const sharedTabs = read("../team/TeamSectionTabs.js");
const footballTabs = read("../team/TeamDetailTabs.js");
const intro = read("../team/TeamIntroCard.js");

test("landing and team overview use only the public table-tennis contract", () => {
  assert.match(landing, /loadPublicTableTennisTeamSummaries/);
  assert.match(landing, /await connection\(\);[\s\S]*loadPublicTableTennisTeamSummaries\(\)/);
  assert.match(landing, /loadPublicTableTennisBoard/);
  assert.match(teams, /loadPublicTableTennisTeamSummaries/);
  for (const source of [landing, teams, detail, board]) assert.doesNotMatch(source, /supabase|\.from\(/);
  assert.match(training, /getVirtualTrainingEvents/);
  assert.match(training, /selectTeamTrainingForDepartment\(loaded, "tischtennis"\)/);
  assert.doesNotMatch(teams, /Junioren|Senioren|Damen|Jugend/);
});

test("table tennis landing keeps a real empty state without fallback teams", () => {
  assert.match(landing, /teamsResult\.data \|\| \[\]/);
  assert.match(landing, /teams\.length \?/);
  assert.match(landing, /Aktuell sind keine aktiven Mannschaften veröffentlicht/);
  assert.doesNotMatch(landing, /1 Herrenmannschaft|1\. Damenmannschaft|fallbackTeams|defaultTeams/);
});

test("team overview resolves live data at request time in dev and production start", () => {
  assert.match(teams, /import \{ connection \} from "next\/server"/);
  assert.match(teams, /await connection\(\);[\s\S]*loadPublicTableTennisTeamSummaries\(\)/);
});

test("team cards link to the dynamic table-tennis detail route", () => {
  assert.match(ui, /buildPublicTableTennisTeamHref\(team\.slug\)/);
  assert.match(detail, /loadPublicTableTennisTeamBySlug\(slug\)/);
  assert.match(detail, /if \(!result\.data\) notFound\(\)/);
  assert.match(detail, /generateMetadata/);
});

test("team cards render the resolved image and retain the placeholder for a null image", () => {
  assert.match(ui, /team\.imageUrl \? <img src=\{team\.imageUrl\}/);
  assert.match(ui, /: <TeamImagePlaceholder/);
});

test("encoded list href and detail loader share one canonical slug contract", () => {
  assert.match(ui, /buildPublicTableTennisTeamHref\(team\.slug\)/);
  assert.match(repository, /normalizePublicTableTennisTeamSlug\(slug\)/);
  assert.match(repository, /\.eq\("slug", normalizedSlug\)/);
});

test("table-tennis detail uses the shared football tab interaction with training as default", () => {
  for (const label of ["Training", "Kader", "Trainer", "Spielbetrieb", "Kontakt"]) assert.match(detailTabs, new RegExp(`label: "${label}"`));
  assert.match(detailTabs, /TeamSectionTabs tabs=\{tabs\} initialTab="training"/);
  assert.match(sharedTabs, /useState\(initialId\)/);
  assert.match(sharedTabs, /tabs\.find\(\(tab\) => tab\.id === activeTab\)/);
  assert.match(sharedTabs, /active\.content/);
  assert.match(sharedTabs, /aria-pressed=\{isActive\}/);
  assert.match(sharedTabs, /flex-wrap/);
  assert.match(footballTabs, /TeamSectionTabs tabs=\{tabs\} initialTab="training"/);
});

test("department labels remain sport-specific", () => {
  assert.match(detail, /departmentLabel="Tischtennisabteilung"/);
  assert.doesNotMatch(detail, /Fußballabteilung/);
  assert.match(intro, /departmentLabel = "Fußballabteilung"/);
});

test("all table-tennis people use the established central person placeholder", () => {
  assert.match(ui, /COACH_PLACEHOLDER_IMAGE/);
  assert.match(ui, /person\.imageUrl \|\| COACH_PLACEHOLDER_IMAGE/);
  assert.doesNotMatch(ui, /person\.name\?\.charAt/);
  assert.match(ui, /h-56 w-full shrink-0 overflow-hidden bg-black\/20 md:h-72/);
  assert.match(ui, /alt=\{person\.name\} className="h-full w-full object-cover"/);
});

test("detail and competition pages stay table-tennis specific and omit football fields", () => {
  assert.match(detail, /TableTennisTeamHero/);
  assert.match(detail, /Tischtennis/);
  assert.doesNotMatch(detail, /shirt_number|position_de|strong_foot|FootballDe|FuPa|fupa/);
  assert.doesNotMatch(ui, /shirt_number|position_de|strong_foot/);
  assert.match(competition, /loadPublicTableTennisCompetitionOptions/);
  assert.match(competition, /TableTennisCompetitionView/);
  assert.doesNotMatch(competition, /football\.de|fupa/i);
});

test("training, coaches, standalone board and explicit team contact retain scoped DTO boundaries", () => {
  assert.match(training, /TrainingEventsOverview/);
  assert.match(training, /basePath="\/tischtennis\/trainingszeiten"/);
  assert.match(board, /loadPublicTableTennisBoard/);
  assert.match(detailTabs, /TableTennisContactCard/);
  assert.match(ui, /Für diese Mannschaft ist derzeit kein Ansprechpartner hinterlegt\./);
  assert.match(repository, /resolvePublicTableTennisContact\(\{ team: \{ \.\.\.team, \.\.\.teamSeason \} \}\)/);
  assert.match(repository, /\.eq\("department_id", department\.id\)/);
  assert.match(repository, /\.eq\("organization_scope", "department"\)/);
  assert.doesNotMatch(ui, /admin|service_role|SUPABASE_SERVICE_ROLE_KEY/);
});

test("responsive UI keeps bounded grids and overflow-safe content", () => {
  assert.match(ui, /min-w-0/);
  assert.match(ui, /break-words/);
  assert.match(teams, /md:grid-cols-2/);
  assert.match(detailTabs, /sm:grid-cols-2 lg:grid-cols-3/);
});
