import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const link = read("./TeamOverviewBackLink.js");
const footballDetail = read("../../../app/(website)/fussball/[slug]/page.js");
const tableTennisDetail = read(
  "../../../app/(website)/tischtennis/mannschaften/[slug]/page.js",
);

test("team detail pages share one semantic overview link before their hero", () => {
  assert.match(link, /import Link from "next\/link"/);
  assert.match(link, /Zurück zur Mannschaftsübersicht/);
  assert.match(link, /focus-visible:outline/);
  assert.doesNotMatch(link, /router\.back|history\.back/);
  assert.match(
    footballDetail,
    /<TeamOverviewBackLink href=\{overviewHref\} \/>[\s\S]*<TeamHero/,
  );
  assert.match(
    tableTennisDetail,
    /<TeamOverviewBackLink[\s\S]*<TableTennisTeamHero/,
  );
});

test("football and table-tennis detail content remains intact", () => {
  for (const contract of ["TeamHero", "TeamIntroCard", "TeamDetailTabs"]) {
    assert.match(footballDetail, new RegExp(contract));
  }
  for (const contract of [
    "TableTennisTeamHero",
    "TeamIntroCard",
    "TableTennisTeamDetailTabs",
  ]) {
    assert.match(tableTennisDetail, new RegExp(contract));
  }
  assert.match(link, /max-w-full/);
});
