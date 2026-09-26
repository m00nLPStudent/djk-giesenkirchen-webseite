import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const header = read("../../Header.js");
const repository = read("./resultsTickerPublic.repository.js");
const core = read("./resultsTickerPublic.core.mjs");
const ticker = read("./ResultsTicker.js");
const css = read("../../../app/globals.css");
const actions = read("../../../app/admin/results/actions.js");
const sportIcon = read("../events/TrainingSportIcon.js");

test("header loads public DTOs on the server and places ticker between service and navigation", () => {
  assert.match(header, /loadPublicResultsTicker/);
  assert.ok(header.indexOf("Mobile Service-Links") < header.indexOf("<ResultsTicker"));
  assert.ok(header.indexOf("<ResultsTicker") < header.indexOf("<Navigation"));
});

test("repository enforces the public visibility and active-structure contract", () => {
  assert.match(repository, /from\("club_results"\)/);
  assert.match(repository, /eq\("is_published", true\)/);
  assert.match(repository, /visible_from\.is\.null[\s\S]*played_at\.lte[\s\S]*visible_from\.lte/);
  for (const fragment of ["team_seasons.is_active", "team_seasons.teams.is_active", "team_seasons.teams.departments.is_active", "team_seasons.seasons.is_active"]) assert.match(repository, new RegExp(fragment.replaceAll(".", "\\.")));
  assert.doesNotMatch(repository, /football-de|fussballde|click-tt|mytischtennis|wttv/i);
});

test("public DTO exposes no private result or media metadata", () => {
  assert.match(core, /PUBLIC_SITE_LOGO_URL/);
  assert.doesNotMatch(core, /created_by|updated_by|storage_path|permission/i);
  assert.match(repository, /loadPublicMediaUrlMap/);
});

test("ticker hides empty contexts and duplicate animation content from assistive technology", () => {
  assert.match(ticker, /if \(!visibleResults\.length\) return null/);
  assert.match(ticker, /aria-hidden="true"/);
  assert.match(ticker, /aria-label="Aktuelle Vereinsergebnisse"/);
  assert.equal((ticker.match(/className="results-ticker__track"/g) || []).length, 2);
});

test("motion pauses on hover and focus and reduced motion becomes scrollable", () => {
  assert.match(css, /results-ticker:hover[\s\S]*animation-play-state: paused/);
  assert.match(css, /results-ticker:focus-within[\s\S]*animation-play-state: paused/);
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]*results-ticker__viewport[\s\S]*overflow-x: auto/);
  assert.match(css, /results-ticker__marquee--active[\s\S]*animation: none/);
});

test("ticker reuses structured website sport icons without a team-name heuristic", () => {
  assert.match(ticker, /import \{ SportIcon \} from "@\/components\/website\/events\/TrainingSportIcon"/);
  assert.match(ticker, /RESULT_SPORT_ICON = Object\.freeze\(\{ fussball: "football", tischtennis: "table-tennis" \}\)/);
  assert.match(ticker, /RESULT_SPORT_ICON\[result\.departmentSlug\]/);
  assert.doesNotMatch(ticker, /teamName\.(?:includes|startsWith|match)/);
  assert.match(sportIcon, /football\.png/);
  assert.match(sportIcon, /table-tennis\.png/);
  assert.match(sportIcon, /aria-hidden="true"/);
});

test("ticker has no independent card background border radius or shadow", () => {
  const outerRule = css.match(/\.results-ticker \{([\s\S]*?)\}/)?.[1] || "";
  assert.doesNotMatch(outerRule, /background|border|border-radius|box-shadow/);
  assert.match(outerRule, /height: var\(--public-results-ticker-height\)/);
});

test("ticker viewport softly masks both edges without adding a background card", () => {
  const viewportRule = css.match(/\.results-ticker__viewport \{([\s\S]*?)\n\}/)?.[1] || "";
  assert.match(viewportRule, /--results-ticker-edge-fade: clamp\(1\.25rem, 6vw, 2rem\)/);
  assert.match(viewportRule, /-webkit-mask-image: linear-gradient\(/);
  assert.match(viewportRule, /mask-image: linear-gradient\(/);
  assert.match(viewportRule, /transparent[\s\S]*#000 var\(--results-ticker-edge-fade\)[\s\S]*#000 calc\(100% - var\(--results-ticker-edge-fade\)\)[\s\S]*transparent/);
  assert.doesNotMatch(viewportRule, /background|border|box-shadow/);
  assert.match(css, /min-width: 1280px[\s\S]*--results-ticker-edge-fade: clamp\(2rem, 3vw, 3rem\)/);
});

test("approved animation duration direction and interaction contracts remain unchanged", () => {
  assert.match(css, /animation: public-results-marquee 45s linear infinite/);
  assert.match(css, /from \{ transform: translate3d\(0, 0, 0\); \}/);
  assert.match(css, /to \{ transform: translate3d\(-50%, 0, 0\); \}/);
  assert.match(css, /results-ticker__marquee--active[\s\S]*will-change: transform/);
  assert.doesNotMatch(css.match(/@keyframes public-results-marquee \{([\s\S]*?)\n\}/)?.[1] || "", /(?:left|right|margin|width|padding|scroll-left)\s*:/);
  assert.match(css, /animation-play-state: paused/);
});

test("reduced motion keeps horizontally reachable content fully readable", () => {
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]*results-ticker__viewport[\s\S]*overflow-x: auto[\s\S]*-webkit-mask-image: none[\s\S]*mask-image: none/);
});

test("visible ticker stays logo-score compact while its accessible name retains both clubs", () => {
  assert.match(ticker, /aria-label=\{`\$\{result\.teamName\}, \$\{result\.homeName\} gegen \$\{result\.awayName\}, Endstand \$\{result\.homeScore\} zu \$\{result\.awayScore\}`\}/);
  assert.doesNotMatch(ticker, />\{result\.(?:homeName|awayName)\}<\/span>/);
  assert.match(ticker, /\{result\.teamName\}/);
  assert.match(ticker, /src=\{result\.homeLogoUrl\}/);
  assert.match(ticker, /src=\{result\.awayLogoUrl\}/);
  assert.match(ticker, /\{result\.homeScore\} : \{result\.awayScore\}/);
});

test("desktop ticker is right-aligned and compact while smaller breakpoints keep full width", () => {
  assert.match(header, /inset-x-0 top-full[\s\S]*xl:right-6[\s\S]*xl:left-auto[\s\S]*xl:w-\[min\(50%,44rem\)\]/);
  assert.doesNotMatch(header, /xl:left-\[25rem\]/);
});

test("every non-empty ticker animates without an overflow measurement", () => {
  assert.match(ticker, /if \(!visibleResults\.length\) return null/);
  assert.match(ticker, /results-ticker__marquee results-ticker__marquee--active/);
  assert.doesNotMatch(ticker, /ResizeObserver|scrollWidth|clientWidth|overflows/);
  assert.match(css, /min-width: min\(100vw, 44rem\)/);
  assert.match(css, /padding-right: clamp\(2rem, 8vw, 6rem\)/);
});

test("all admin result mutations revalidate the public header layout", () => {
  assert.match(actions, /revalidatePublicContent\("results"\)/);
  assert.match(actions, /saveResultAction[\s\S]*refresh\(\)/);
  assert.match(actions, /toggleResultPublishedAction[\s\S]*refresh\(\)/);
  assert.match(actions, /deleteResultAction[\s\S]*refresh\(\)/);
});
