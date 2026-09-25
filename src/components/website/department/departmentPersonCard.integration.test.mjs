import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const card = read("./DepartmentPersonCard.js");
const grid = read("./DepartmentPersonGrid.js");
const coachPage = read("../../../app/(website)/fussball/abteilung/trainer/page.js");
const boardPage = read("../../../app/(website)/fussball/abteilung/vorstand/page.js");

test("department people share a bounded vertical card and responsive equal-width grid", () => {
  assert.match(card, /flex h-full min-w-0 flex-col overflow-hidden/);
  assert.match(card, /h-56 w-full shrink-0 overflow-hidden bg-black\/20 md:h-72/);
  assert.match(card, /className="h-full w-full object-cover"/);
  assert.match(card, /flex min-w-0 flex-1 flex-col/);
  assert.match(card, /mt-auto flex gap-3 pt-6/);
  assert.match(grid, /sm:grid-cols-2 xl:grid-cols-3/);
});

test("football coach assignments, normalized licenses and board responsibilities remain wired", () => {
  assert.match(coachPage, /imageBadge=\{getCoachTeamName\(coach\)\}/);
  assert.match(coachPage, /meta=\{getPublicCoachLicense\(coach\.license\)\}/);
  assert.match(card, /BoardResponsibilitiesList responsibilities=\{person\.responsibilities\}/);
  assert.match(boardPage, /attachPublicBoardResponsibilities/);
});

test("contact actions remain conditional and accessible", () => {
  assert.match(card, /\{phoneHref && \(/);
  assert.match(card, /\{person\.email && \(/);
  assert.match(card, /aria-label=\{`\$\{fullName\} anrufen`\}/);
  assert.match(card, /aria-label=\{`\$\{fullName\} eine E-Mail schreiben`\}/);
});
