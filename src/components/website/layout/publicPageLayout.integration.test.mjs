import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const shell = read("src/components/website/layout/PublicPageShell.js");
const hero = read("src/components/website/layout/PublicPageHero.js");
const card = read("src/components/website/layout/PublicCard.js");
const websiteLayout = read("src/app/(website)/layout.js");
const globals = read("src/app/globals.css");
const placeholder = read("src/components/website/content/PublicSectionPlaceholder.js");
const departmentLayout = read("src/components/website/department/DepartmentPageLayout.js");

test("public layout provides one background and navigation-safe responsive offset", () => {
  assert.match(websiteLayout, /public-site-frame/);
  assert.match(globals, /\.public-site-frame/);
  assert.match(globals, /radial-gradient/);
  assert.match(globals, /main:not\(\.public-home-page\)/);
  assert.match(globals, /padding-top: 7rem/);
  assert.match(globals, /padding-top: 13rem/);
  assert.match(shell, /max-w-7xl/);
  assert.match(shell, /px-4/);
  assert.match(shell, /sm:px-6/);
});

test("accepted public core colors use the existing global design tokens", () => {
  const home = read("src/app/(website)/page.js");
  const news = read("src/app/(website)/news/page.js");
  const membership = read("src/app/(website)/mitglied-werden/page.js");

  assert.match(globals, /--vereinsrot: #c4001a/);
  assert.match(globals, /--dunkel: #101014/);
  assert.match(globals, /\.public-site-frame[\s\S]*var\(--dunkel\)/);
  for (const source of [home, news, membership]) {
    assert.match(source, /bg-\[var\(--dunkel\)\]/);
  }
  assert.match(card, /bg-\[#18181f\]\/90/);
});

test("shared hero and card establish the common public design geometry", () => {
  assert.match(hero, /<header/);
  assert.match(hero, /<h1/);
  assert.match(hero, /text-4xl/);
  assert.match(hero, /lg:text-7xl/);
  assert.match(hero, /tracking-\[0\.3em\]/);
  assert.match(card, /bg-\[#18181f\]\/90/);
  assert.match(card, /border-white\/10/);
  assert.match(card, /rounded-3xl/);
});

test("shared department and placeholder pages place heroes outside content cards", () => {
  assert.match(placeholder, /<PublicPageHero/);
  assert.match(placeholder, /<PublicCard/);
  assert.doesNotMatch(placeholder, /overflow-hidden rounded-\[2rem\].*<PublicPageHero/s);
  assert.match(departmentLayout, /<PublicPageShell/);
  assert.match(departmentLayout, /<PublicPageHero/);
});

test("reviewed overview pages use the shared shell or shared placeholder", () => {
  const routes = [
    "verein/page.js",
    "verein/vorstand/page.js",
    "verein/vereinsgeschichte/page.js",
    "behindertensport/page.js",
    "damen-gymnastik/page.js",
    "tischtennis/page.js",
    "termine/page.js",
    "termine/allgemein/page.js",
    "termine/training/page.js",
    "fussball/page.js",
    "fussball/mannschaften/page.js",
    "fussball/mannschaften/senioren/page.js",
    "fussball/mannschaften/junioren/page.js",
    "fussball/mannschaften/damen/page.js",
    "anfahrt/page.js",
    "cookie-einstellungen/page.js",
  ];

  for (const route of routes) {
    const path = `src/app/(website)/${route}`;
    assert.equal(existsSync(resolve(root, path)), true, route);
    assert.match(read(path), /PublicPageShell|PublicSectionPlaceholder|ClubHistoryPublicPage/, route);
  }
  assert.match(read("src/components/website/downloads/DownloadsPublicPage.js"), /PublicPageShell/);
});

test("club overview cards are dark and smaller departments share one structure", () => {
  const club = read("src/app/(website)/verein/page.js");
  const disability = read("src/app/(website)/behindertensport/page.js");
  const gymnastics = read("src/app/(website)/damen-gymnastik/page.js");
  assert.match(club, /<PublicCard/);
  assert.doesNotMatch(club, /bg-white p-6/);
  assert.match(disability, /Beschreibung der Abteilung/);
  assert.match(gymnastics, /Beschreibung der Abteilung/);
  assert.match(gymnastics, /Angebote und Aktivitäten/);
  assert.match(gymnastics, /Geschichte und Über uns/);
  assert.match(gymnastics, /Kontakt und Ansprechpartner/);
});

test("published club history uses the confirmed global CMS source and preserves the legacy football route", () => {
  const sharedHistory = read("src/components/website/club-history/ClubHistoryPublicPage.js");
  const publicFootballHistory = read("src/app/(website)/fussball/vereinsgeschichte/page.js");
  const publicClubHistory = read("src/app/(website)/verein/vereinsgeschichte/page.js");
  assert.match(sharedHistory, /club_history_pages/);
  assert.match(sharedHistory, /CLUB_HISTORY_PAGE_KEY/);
  assert.match(sharedHistory, /Gesamtverein/);
  assert.match(publicClubHistory, /ClubHistoryPublicPage/);
  assert.match(publicFootballHistory, /permanentRedirect\("\/verein\/vereinsgeschichte"\)/);
});
