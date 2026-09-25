import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("club board route uses the server-only scoped repository and public media placeholder", () => {
  const repository = read("src/components/website/club-board/clubBoardPublic.repository.js");
  const page = read("src/app/(website)/verein/vorstand/page.js");
  assert.match(repository, /import "server-only"/);
  assert.match(repository, /\.eq\("organization_scope", "club"\)/);
  assert.match(repository, /\.is\("department_id", null\)/);
  assert.match(repository, /\.eq\("is_active", true\)/);
  assert.match(repository, /\.order\("sort_order", \{ ascending: true \}\)/);
  assert.match(repository, /loadPublicMediaUrlMap/);
  assert.match(repository, /BOARD_PLACEHOLDER_IMAGE/);
  assert.match(page, /await connection\(\)/);
  assert.doesNotMatch(repository, /\.select\("\*"/);
  assert.doesNotMatch(repository.match(/\.select\("([^"]+)/)?.[1] || "", /email|phone|audit|created_at|updated_at/);
  assert.match(page, /Aktuell sind keine Vorstandsmitglieder veröffentlicht/);
});

test("Verein navigation links the distinct club board route", () => {
  const navigation = read("src/components/website/navigation/navigationConfig.js");
  assert.match(navigation, /\{ label: "Vorstand", href: "\/verein\/vorstand" \}/);
  assert.match(navigation, /href: "\/fussball\/abteilung\/vorstand"/);
  assert.match(navigation, /href: "\/tischtennis\/vorstand"/);
});

test("club board cards use the shared vertical public person-card geometry", () => {
  const card = read("src/components/website/club-board/ClubBoardMemberCard.js");
  assert.match(card, /flex h-full min-w-0 flex-col overflow-hidden/);
  assert.match(card, /h-56 w-full shrink-0 overflow-hidden bg-black\/20 md:h-72/);
  assert.match(card, /className="h-full w-full object-cover"/);
  assert.match(card, /break-words text-xs/);
  assert.match(card, /break-words text-2xl/);
  assert.match(card, /BoardResponsibilitiesList/);
});
