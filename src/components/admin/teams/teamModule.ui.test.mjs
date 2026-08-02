import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const root = new URL("./", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("team overview uses shared header search filters and responsive list", async () => {
  const [page, controls, list] = await Promise.all([read("../../../app/admin/teams/page.js"), read("components/TeamsHeaderSearchControls.js"), read("AdminTeamsList.js")]);
  for (const item of ["AdminModulePage", "AdminModuleHeader", "Neue Mannschaft"]) assert.ok(page.includes(item));
  for (const item of ["AdminModuleSearch", "AdminModuleFilters", "method=\"get\""]) assert.ok(controls.includes(item));
  for (const item of ["AdminModuleList", "AdminModuleCards", "AdminListHeader", "AdminListRow", "AdminListMobileCard", "AdminListChevron", "Beiträge"]) assert.ok(list.includes(item));
});

test("team detail uses shared information contribution player and danger primitives", async () => {
  const detail = await read("components/TeamContributionDetailView.js");
  for (const item of ["AdminDetailLayout", "AdminDetailHeader", "AdminInformationSection", "AdminInformationRow", "AdminModuleSummary", "AdminMetric", "AdminModuleList", "PlayerAvatar", "AdminDangerZone", "ArchiveButton"]) assert.ok(detail.includes(item));
  const header = detail.slice(
    detail.indexOf("const headerActions"),
    detail.indexOf("const playerColumns"),
  );
  assert.doesNotMatch(header, /ArchiveButton/);
  assert.match(detail, /Aktive Spieler- und Trainerzuordnungen werden beendet/);
});

test("team create and edit retain forms inside shared shells", async () => {
  const pages = await Promise.all([read("../../../app/admin/teams/new/page.js"), read("../../../app/admin/teams/edit/[id]/page.js")]);
  for (const page of pages) for (const item of ["AdminModulePage", "AdminModuleHeader", "AdminBackLink", "AdminTeamsForm", "TeamScopeGate"]) assert.ok(page.includes(item));
});
