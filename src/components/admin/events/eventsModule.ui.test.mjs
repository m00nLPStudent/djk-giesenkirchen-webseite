import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const list = read("./AdminEventsList.js");
const page = read("../../../app/admin/events/page.js");
const editPage = read("../../../app/admin/events/edit/[id]/page.js");
const loader = read("../../../lib/events/eventLoader.js");

test("overview uses the shared responsive module system", () => {
  for (const primitive of ["AdminModuleHeader", "AdminModuleSearch", "AdminModuleSummary", "AdminModuleList", "AdminModuleCards", "AdminModuleEmptyState"]) assert.ok(list.includes(primitive));
  assert.match(list, /desktopClassName="hidden overflow-hidden xl:block"/);
  assert.match(list, /className="xl:hidden"/);
  assert.doesNotMatch(list, /overflow-x-auto/);
});

test("existing virtual training source is session-bound and scope-filtered", () => {
  assert.match(page, /getVirtualTrainingEvents/);
  assert.match(page, /supabaseClient: permissionResult\.supabaseServer/);
  assert.match(page, /canAccessTeamOnServer\(scopeContext, event\)/);
  assert.match(loader, /supabaseClient = supabase/);
  assert.doesNotMatch(page, /insert|update|upsert|delete/);
});

test("admin overview requests only tomorrow and exposes the practical summary", () => {
  assert.match(page, /getNextCalendarDayWindow\(now\)/);
  assert.match(page, /maxOccurrencesPerTraining: 1/);
  assert.doesNotMatch(page, /365 \* 24|rangeMs/);
  for (const label of ["Veröffentlicht", "Geplant", "Entwurf", "Training morgen"]) assert.ok(list.includes(label));
  for (const removedLabel of ['label="Gesamt"', 'label="Verein"', 'label="Mannschaft"']) assert.equal(list.includes(removedLabel), false);
});

test("team dates keep their existing team editor while club dates keep event editing", () => {
  assert.match(list, /admin\/teams\/edit/);
  assert.match(list, /admin\/events\/edit/);
  assert.match(list, /teams\.edit/);
  assert.match(list, /events\.edit/);
});

test("club detail follows the shared detail header and has no header danger action", () => {
  assert.match(editPage, /AdminDetailHeader/);
  assert.match(editPage, /AdminDetailLayout/);
  assert.match(editPage, /Bearbeiten/);
  assert.doesNotMatch(editPage, /Löschen|Archivieren/);
});
