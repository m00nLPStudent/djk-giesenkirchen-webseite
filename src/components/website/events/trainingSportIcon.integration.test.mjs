import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = process.cwd();
const source = readFileSync(new URL("./TrainingSportIcon.js", import.meta.url), "utf8");
const rowSource = readFileSync(new URL("./HomeEventsSection.js", import.meta.url), "utf8");

test("known training sports map to the new local raster assets", () => {
  for (const asset of ["football.png", "table-tennis.png", "gymnastics.png", "adaptive-sports.png"]) {
    assert.match(source, new RegExp(`/images/sports-icons/${asset.replace(".", "\\.")}`));
    assert.equal(existsSync(resolve(root, `public/images/sports-icons/${asset}`)), true, asset);
  }
  assert.match(source, /SPORT_ICON_ASSETS\[resolveTrainingSport\(event\)\]/);
  assert.match(source, /src=\{assetPath\}/);
});

test("known sports render next image while only unknown sports use the neutral fallback", () => {
  assert.match(source, /import Image from "next\/image"/);
  assert.match(source, /if \(!assetPath\)/);
  assert.match(source, /return <CalendarDays/);
  assert.match(source, /width=\{48\}/);
  assert.match(source, /height=\{48\}/);
  assert.match(source, /sizes="48px"/);
  assert.match(source, /alt=""/);
  assert.match(source, /aria-hidden="true"/);
});

test("legacy sport svg render paths are fully removed", () => {
  assert.doesNotMatch(source, /FootballIcon|TableTennisIcon|GymnasticsIcon|AdaptiveSportsIcon/);
  assert.doesNotMatch(source, /football-surface|football-panel|paddle-red-face|gymnastics-motion|adaptive-athlete/);
  assert.doesNotMatch(source, /PersonStanding|\bActivity\b/);
  assert.doesNotMatch(source, /<svg\b/);
});

test("training assets dominate the enlarged neutral container", () => {
  assert.match(rowSource, /bg-\[#111117\]\/85/);
  assert.match(rowSource, /h-14 w-14/);
  assert.match(source, /h-12 w-12 object-contain/);
  assert.doesNotMatch(rowSource, /bg-red-600\/15/);
});
