import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("./", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("coach overview keeps search in the page header and filters collapsed", async () => {
  const [overview, filters] = await Promise.all([
    read("AdminCoachesOverview.js"),
    read("components/CoachFilters.js"),
  ]);

  assert.match(overview, /<AdminPageHeader/);
  assert.match(overview, /type="search"/);
  assert.match(overview, /<CoachStats coaches=\{coaches\}/);
  assert.match(filters, /useState\(false\)/);
  assert.match(filters, /aria-expanded=\{expanded\}/);
});

test("coach list switches from mobile cards to a desktop table at lg", async () => {
  const [list, card] = await Promise.all([
    read("AdminCoachesList.js"),
    read("components/CoachCard.js"),
  ]);

  for (const column of ["Profil", "Name", "Rolle", "Mannschaft(en)", "Status", "Details"]) {
    assert.ok(list.includes(column));
  }
  assert.match(list, /hidden overflow-hidden lg:block/);
  assert.match(card, /lg:hidden/);
  assert.match(list, /<CoachAvatar coach=\{coach\}/);
  assert.match(card, /<CoachAvatar coach=\{coach\}/);
});

test("shared coach avatar uses the canonical resolver and a load-error fallback", async () => {
  const avatar = await read("components/CoachAvatar.js");

  assert.match(avatar, /resolveCoachImageUrl\(coach, COACH_PLACEHOLDER_IMAGE\)/);
  assert.match(avatar, /onError=\{\(\) => setLoadFailed\(true\)\}/);
  assert.match(avatar, /if \(loadFailed\)/);
  assert.doesNotMatch(avatar, /src=\{coach\?\./);
});

test("coach work view exposes compact information and danger sections", async () => {
  const detail = await read("components/CoachDetailOverview.js");

  for (const section of ["Persönliche Daten", "Kontakt", "Mannschaften", "Lizenzen", "Notizen", "Historie", "Gefahrenbereich"]) {
    assert.ok(detail.includes(section));
  }
  assert.match(detail, /#coach-edit-form/);
  assert.match(detail, /Eine Archivfunktion ist nicht vorhanden/);
  assert.match(detail, /<CoachAvatar coach=\{coach\} sizeClassName="h-16 w-16"/);
  assert.doesNotMatch(detail, /next\/image/);
  assert.doesNotMatch(detail, /image_url|photo_url/);
});
