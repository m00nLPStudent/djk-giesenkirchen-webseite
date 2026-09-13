import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("public layout owns consent while admin remains outside it", async () => {
  const [publicLayout, adminLayout] = await Promise.all([read("../../../app/(website)/layout.js"), read("../../../app/admin/layout.js")]);
  assert.match(publicLayout, /<ConsentProvider>/);
  assert.doesNotMatch(adminLayout, /ConsentProvider/);
});

test("dialog exposes equal first-layer choices and accessible modal behavior", async () => {
  const source = await read("./ConsentProvider.js");
  for (const label of ["Alle akzeptieren", "Nur notwendige", "Einstellungen", "Datenschutz", "Impressum"]) assert.match(source, new RegExp(label));
  assert.match(source, /role="dialog"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /event\.key !== "Tab"/);
  assert.match(source, /event\.key === "Escape"/);
  assert.match(source, /dialogMode === "required"\) save\(false\)/);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML/);
});

test("football and maps embeds remain gated until external consent", async () => {
  const [football, maps, placeholder] = await Promise.all([read("../football-de/FootballDeWidget.js"), read("../maps/GoogleMapsPanel.js"), read("./ExternalContentPlaceholder.js")]);
  assert.match(football, /!widgetId \|\| !externalMediaAllowed/);
  assert.match(football, /if \(!externalMediaAllowed\)/);
  assert.match(football, /ExternalContentPlaceholder provider="FUSSBALL\.DE"/);
  assert.match(maps, /showMap && externalMediaAllowed/);
  assert.match(maps, /embedUrl && !externalMediaAllowed/);
  assert.match(placeholder, /allowExternalMedia/);
});

test("footer and settings route reopen the central preferences", async () => {
  const [footer, page] = await Promise.all([read("../../../components/Footer.js"), read("../../../app/(website)/cookie-einstellungen/page.js")]);
  assert.match(footer, /ConsentSettingsButton/);
  assert.match(page, /ConsentSettingsButton/);
  assert.doesNotMatch(page, /wird derzeit vorbereitet/);
});
