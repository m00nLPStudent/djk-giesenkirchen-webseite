import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const navigationSource = read("src/components/website/navigation/Navigation.js");
const configSource = read("src/components/website/navigation/navigationConfig.js");
const headerSource = read("src/components/Header.js");
const footerSource = read("src/components/Footer.js");
const homeSource = read("src/app/(website)/page.js");
const homeEventsSource = read("src/components/website/events/HomeEventsSection.js");
const trainingSportIconSource = read("src/components/website/events/TrainingSportIcon.js");

test("public navigation exposes the agreed club and department structure", () => {
  for (const label of [
    "Startseite",
    "Verein",
    "Fußball",
    "Tischtennis",
    "Gymnastikdamen",
    "Behindertensport",
    "Kontakt",
    "Mitglied werden",
    "Sponsoren",
    "Vorstand Gesamtverein",
    "Spielplan & Tabelle",
    "Turniere & Events",
  ]) {
    assert.match(configSource, new RegExp(label.replace("&", "\\&")));
  }
});

test("every newly introduced navigation target has a real page", () => {
  for (const route of [
    "verein/vorstand",
    "verein/vereinsgeschichte",
    "fussball/turniere-events",
    "behindertensport",
    "tischtennis/mannschaften",
    "tischtennis/spielplan-tabelle",
    "tischtennis/vorstand",
    "tischtennis/termine",
  ]) {
    assert.equal(existsSync(resolve(root, `src/app/(website)/${route}/page.js`)), true, route);
  }
  assert.doesNotMatch(configSource, /\/fussball\/(turniere|events)["']/);
});

test("desktop and mobile navigation expose accessible disclosure controls", () => {
  assert.match(navigationSource, /aria-label="Hauptnavigation"/);
  assert.match(navigationSource, /aria-label="Mobile Hauptnavigation"/);
  assert.match(navigationSource, /aria-expanded=/);
  assert.match(navigationSource, /aria-controls=/);
  assert.match(navigationSource, /event\.key === "Escape"/);
  assert.match(navigationSource, /focus-visible:outline/);
  assert.match(navigationSource, /openMobileMenus/);
  assert.match(navigationSource, /aria-current=/);
  assert.match(navigationSource, /bg-red-600\/45/);
  assert.match(navigationSource, /bg-red-600\/20/);
  assert.match(navigationSource, /ring-red-600\/50/);
  assert.match(navigationSource, /bg-red-600 px-3 py-3 text-\[0\.85rem\]/);
  assert.match(navigationSource, /bg-red-600 px-\[1\.125rem\] py-3\.5 text-\[1rem\]/);
  assert.doesNotMatch(navigationSource, new RegExp(["#ff", "6467"].join("")));
  assert.doesNotMatch(navigationSource, new RegExp(["rgba\\(255", "100", "103"].join(",")));
  assert.doesNotMatch(navigationSource, /#742734/);
});

test("header has no global h1 and shares the centralized logo source", () => {
  assert.doesNotMatch(headerSource, /<h1\b/);
  assert.match(headerSource, /PUBLIC_SITE_LOGO_URL/);
  assert.match(footerSource, /PUBLIC_SITE_LOGO_URL/);
  assert.match(headerSource, /max-w-\[90rem\]/);
  assert.match(headerSource, /xl:h-36/);
  assert.match(headerSource, /xl:bottom-0/);
  assert.match(headerSource, /xl:translate-y-1\/2/);
  assert.match(headerSource, /xl:left-\[9\.5rem\]/);
  assert.match(navigationSource, /rounded-full border border-white\/10 bg-\[#15151b\]\/90/);
  assert.match(navigationSource, /top-\[calc\(100%-0\.125rem\)\]/);
});

test("footer contains no fake cookie or missing AGB link", () => {
  assert.doesNotMatch(footerSource, /href="#"/);
  assert.doesNotMatch(footerSource, /href="\/agb"/);
  assert.match(footerSource, /Behindertensport/);
  assert.match(footerSource, /social_links/);
});

test("home reuses virtual training generation without loading general events", () => {
  assert.match(homeSource, /getVirtualTrainingEvents/);
  assert.match(homeSource, /selectUpcomingHomeTrainings/);
  assert.match(homeSource, /export const dynamic = "force-dynamic"/);
  assert.match(homeSource, /365 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(homeSource, /maxOccurrencesPerTraining: 180/);
  assert.doesNotMatch(homeSource, /\.from\("events"\)/);
  assert.match(homeEventsSource, /Nächste Trainingstermine/);
  assert.match(homeEventsSource, /\/termine\/training/);
  assert.match(homeEventsSource, /keine kommenden Trainingstermine/);
  assert.match(homeEventsSource, /TrainingSportIcon/);
  assert.match(trainingSportIconSource, /\/images\/sports-icons\/football\.png/);
  assert.match(trainingSportIconSource, /\/images\/sports-icons\/table-tennis\.png/);
  assert.match(trainingSportIconSource, /\/images\/sports-icons\/gymnastics\.png/);
  assert.match(trainingSportIconSource, /\/images\/sports-icons\/adaptive-sports\.png/);
  assert.match(trainingSportIconSource, /CalendarDays/);
  assert.match(navigationSource, /bg-\[#15151b\]\/90 px-2 py-2\.5/);
  assert.match(navigationSource, /px-2\.5 py-2\.5/);
  assert.match(homeEventsSource, /grid-cols-\[auto_minmax\(0,1fr\)_auto\]/);
  assert.match(homeSource, /max-w-\[90rem\]/);
});
