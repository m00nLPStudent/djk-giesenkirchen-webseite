import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const detail = read("./components/TeamContributionDetailView.js");
const header = read("../design-system/AdminDetail.js");
const background = read("../design-system/AdminDecorativeBackgroundImage.js");
const page = read("../../../app/admin/teams/[id]/page.js");

test("team detail uses the canonical team image only in the existing header panel", () => {
  assert.match(detail, /backgroundImageUrl=\{team\.team_image_url\}/);
  assert.doesNotMatch(detail, /team_image_url\s*\|\|/);
  assert.equal((detail.match(/AdminDetailHeader/g) || []).length, 2);
});

test("decorative background is subtle, responsive and layered below content", () => {
  assert.match(background, /alt=""/);
  assert.match(background, /aria-hidden="true"/);
  assert.match(background, /object-cover/);
  assert.match(background, /opacity-\[0\.11\]/);
  assert.match(background, /max-md:/);
  assert.match(header, /relative z-10/);
});

test("missing and invalid image URLs safely fall back to the normal panel", () => {
  assert.match(background, /if \(!src \|\| failedSrc === src\) return null/);
  assert.match(background, /onError=\{\(\) => setFailedSrc\(src\)\}/);
  assert.doesNotMatch(background, /fetch\(/);
});

test("the existing team query and archive action stay unchanged while edit keeps its route context", () => {
  assert.match(page, /\.from\("teams"\)[\s\S]*?\.select\("\*"\)/);
  assert.match(detail, /\$\{basePath\}\/edit\/\$\{team\.id\}/);
  assert.match(detail, /removeTeamWithScopeAction\.bind/);
});
