import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("./", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("player overview uses shared header search primary action and summary", async () => {
  const source = await read("AdminPlayersOverview.js");
  for (const component of ["AdminModulePage", "AdminModuleHeader", "AdminModuleSearch", "AdminModulePrimaryAction", "PlayerStats", "AdminPlayersList"]) assert.ok(source.includes(component));
  assert.match(source, /Spieler, Mannschaftszuordnungen und Beitragsstatus verwalten/);
});

test("player filters retain URL synchronization behind shared disclosure", async () => {
  const source = await read("components/PlayerFilters.js");
  assert.match(source, /AdminModuleFilters/);
  assert.match(source, /syncFiltersToUrl/);
  assert.match(source, /PlayerFiltersDialog/);
});

test("player list uses desktop and mobile design-system primitives", async () => {
  const source = await read("AdminPlayersList.js");
  for (const component of ["AdminModuleList", "AdminModuleCards", "AdminListHeader", "AdminListRow", "AdminListMobileCard", "AdminListChevron", "PlayerAvatar", "PlayerStatusBadge", "ContributionStatusBadge"]) assert.ok(source.includes(component));
  for (const label of ["Profil", "Spieler", "Mannschaft", "Status", "Vereinsbeitrag", "Offen"]) assert.ok(source.includes(label));
  assert.match(source, /xl:hidden/);
  assert.match(source, /xl:block/);
});

test("player avatar uses the canonical resolver and load-error fallback", async () => {
  const source = await read("components/PlayerAvatar.js");
  assert.match(source, /resolvePlayerImageUrl\(player, PLAYER_PLACEHOLDER_IMAGE\)/);
  assert.match(source, /onError=\{\(\) => setLoadFailed\(true\)\}/);
  assert.match(source, /if \(loadFailed\)/);
});

test("player detail uses shared detail information summary and danger primitives", async () => {
  const source = await read("components/PlayerContributionDetailView.js");
  for (const component of ["AdminDetailLayout", "AdminDetailHeader", "AdminInformationSection", "AdminInformationRow", "AdminModuleSummary", "AdminMetric", "AdminActionBar", "AdminDangerZone", "AdminModuleEmptyState", "PlayerAvatar"]) assert.ok(source.includes(component));
  for (const label of ["Persönliche Daten", "Mannschaft", "Saison", "Position", "Rückennummer", "Notizen", "Historie", "Vereinsbeitrag"]) assert.ok(source.includes(label));
  assert.match(source, /hasHeaderActions/);
  assert.match(source, /contributionVisibility/);
});

test("player archive action exists only inside the danger zone", async () => {
  const source = await read("components/PlayerContributionDetailView.js");
  const headerActions = source.slice(
    source.indexOf("const headerActions"),
    source.indexOf("const dangerZone"),
  );
  const dangerZone = source.slice(source.indexOf("const dangerZone"));

  assert.doesNotMatch(headerActions, /Spieler archivieren|ArchiveButton/);
  assert.match(headerActions, /Beitrag öffnen/);
  assert.match(headerActions, /Bearbeiten/);
  assert.match(dangerZone, /AdminDangerZone/);
  assert.match(dangerZone, /ArchiveButton/);
});

test("player create and edit pages use shared module shells", async () => {
  const [createPage, editPage] = await Promise.all([read("../../../app/admin/players/new/page.js"), read("../../../app/admin/players/edit/[id]/page.js")]);
  for (const source of [createPage, editPage]) {
    assert.match(source, /AdminModulePage/);
    assert.match(source, /AdminModuleHeader/);
    assert.match(source, /AdminBackLink/);
    assert.match(source, /AdminPlayersForm/);
  }
});
