import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const widgetPath = new URL("./FootballDeWidget.js", import.meta.url);
const sectionPath = new URL("./FootballDeSection.js", import.meta.url);
const routePath = new URL("../../../app/(website)/fussball/spielplan-tabelle/page.js", import.meta.url);
const stylesPath = new URL("../../../styles/football-de-widget.css", import.meta.url);

test("football.de loader is singleton, cachebuster-free and cleans widget DOM", async () => {
  const source = await readFile(widgetPath, "utf8");
  assert.match(source, /id = "football-de-widget-script"/);
  assert.match(source, /script\.src = FOOTBALL_DE_SCRIPT_SRC/);
  assert.match(source, /widgetNodes\.forEach\(\(node\) => node\.replaceChildren\(\)\)/);
  assert.match(source, /widgetNodes\.delete\(widget\)/);
  assert.doesNotMatch(source, /Date\.now|\?t=/);
});

test("widget presentation stays scoped to the shared wrapper and has no white inset card", async () => {
  const [widget, styles] = await Promise.all([readFile(widgetPath, "utf8"), readFile(stylesPath, "utf8")]);
  assert.match(widget, /football-de-widget-frame bg-black\/20/);
  assert.doesNotMatch(widget, /football-de-widget-frame[^\n]*bg-white|football-de-widget-frame[^\n]*p-4/);
  assert.doesNotMatch(widget, /football-de-widget-frame[^\n]*(?:border|rounded)/);
  assert.match(styles, /\.football-de-widget-shell \.fussballde_widget iframe/);
  assert.doesNotMatch(styles, /!important|\.football-de-widget-shell \.fussballde_widget a/);
  for (const selector of styles.matchAll(/(?:^|\n)([^@\n][^{]+)\s*\{/g)) {
    assert.match(selector[1], /football-de-/);
  }
});

test("public selection drives both widgets and preserves empty states", async () => {
  const [route, section] = await Promise.all([readFile(routePath, "utf8"), readFile(sectionPath, "utf8")]);
  assert.match(route, /FootballDeSection key=\{selected\.slug\} team=\{selected\}/);
  assert.match(route, /aria-current=\{active \? "page" : undefined\}/);
  assert.match(section, /hasTable && hasMatches/);
  assert.match(section, /keine Spielbetriebsdaten hinterlegt/);
  assert.doesNotMatch(section, /showTable/);
});
