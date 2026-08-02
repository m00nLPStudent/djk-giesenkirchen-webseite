import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const page = read("../../../app/admin/club-history/page.js");
const form = read("./forms/ClubHistoryEditorForm.js");
const images = read("./components/ClubHistoryImagesManager.js");
const milestones = read("./components/ClubHistoryMilestonesManager.js");

test("singleton page uses shared module and detail primitives", () => {
  for (const primitive of ["AdminModulePage", "AdminModuleHeader", "AdminDetailLayout", "AdminDetailHeader", "AdminActionBar", "AdminButton", "ClubHistoryStatus", "ClubHistoryDetailOverview"]) assert.ok(page.includes(primitive));
  assert.match(page, /Vereinsgeschichte verwalten/);
  assert.match(page, /Historische Inhalte, Meilensteine und Vereinsentwicklung verwalten/);
});

test("no artificial list, search, summary, filter or route is introduced for the singleton", () => {
  assert.doesNotMatch(page, /AdminModuleSearch|AdminModuleSummary|AdminModuleFilters|AdminModuleList|AdminModuleCards/);
  assert.match(page, /page_key", "fussball-vereinsgeschichte/);
});

test("detail header contains status, metadata and edit but no danger action", () => {
  assert.match(page, /status=\{<ClubHistoryStatus/);
  assert.match(page, /Veröffentlichung:/);
  assert.match(page, />Bearbeiten</);
  assert.doesNotMatch(page, /AdminDangerZone|löschen/i);
});

test("existing page fields remain editable in German", () => {
  for (const label of ["Überschrift (DE)", "Einleitung / Teaser (DE)", "Haupttext (DE)", "Veröffentlichungsdatum", "Sortierung"]) assert.ok(form.includes(label));
  assert.match(form, /club_history\.edit/);
});

test("images use shared preview and existing deletes live in a danger zone", () => {
  assert.match(images, /AdminImagePreview/);
  assert.match(images, /AdminDangerZone title="Bild dauerhaft löschen"/);
  assert.match(images, /deleteClubHistoryImage/);
});

test("milestone periods, status, sorting and delete remain available", () => {
  for (const value of ["milestone_year", "milestone_year_until", "sort_order", "is_active", "deleteClubHistoryMilestone"]) assert.ok(milestones.includes(value));
  assert.match(milestones, /AdminDangerZone title="Meilenstein dauerhaft löschen"/);
  assert.doesNotMatch(milestones, /overflow-x-auto/);
});
