import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const list = read("./AdminSponsorList.js");
const logo = read("./components/SponsorLogo.js");
const filters = read("./components/SponsorFilters.js");
const detail = read("../../../app/admin/sponsors/edit/[id]/page.js");
const overviewPage = read("../../../app/admin/sponsors/page.js");
const form = read("./forms/AdminSponsorForm.js");
const upload = read("./components/SponsorImageUpload.js");
const service = read("./services/sponsors.service.js");
const publicBanner = read("../../website/sponsors/SponsorBanner.js");

test("overview uses shared header, search, primary action and compact summary", () => {
  for (const value of ["AdminModuleHeader", "AdminModuleSearch", "+ Neuer Sponsor", "AdminModuleSummary", "AdminMetric"]) assert.ok(list.includes(value));
  for (const label of ["Gesamt", "Aktiv", "Inaktiv", "Ohne Logo"]) assert.ok(list.includes(label));
});

test("filter is the default-collapsed shared disclosure", () => {
  assert.match(filters, /AdminModuleFilters/);
  assert.doesNotMatch(filters, /defaultExpanded/);
});

test("desktop table and mobile cards expose existing sponsor information without nested website links", () => {
  for (const value of ["AdminModuleList", "AdminListHeader", "AdminListRow", "AdminModuleCards", "AdminListMobileCard", "AdminListChevron", "SponsorLogo", "SponsorStatus"]) assert.ok(list.includes(value));
  assert.match(list, /hidden overflow-hidden xl:block/);
  assert.match(list, /className="xl:hidden"/);
  assert.doesNotMatch(list, /overflow-x-auto|target="_blank"|<a /);
});

test("empty lists and filtered searches use the shared empty state", () => {
  assert.match(list, /AdminModuleEmptyState/);
  assert.match(list, /Noch keine Sponsoren angelegt/);
  assert.match(list, /Keine Sponsoren gefunden/);
});

test("logo renders proportionally and falls back for missing, empty or failed URLs", () => {
  assert.match(logo, /object-contain/);
  assert.match(logo, /onError=\{\(\) => setFailedSrc\(src\)\}/);
  assert.match(logo, /Boolean\(String\(src \|\| ""\)\.trim\(\)/);
  assert.match(logo, /Kein Logo für/);
  assert.doesNotMatch(logo, /<img[^>]+src=""/);
});

test("detail combines header, status, metadata, information, image preview and safe website action", () => {
  for (const value of ["AdminDetailLayout", "AdminDetailHeader", "SponsorLogo", "SponsorStatus", "SponsorDetailOverview", "Bearbeiten", "Website öffnen"]) assert.ok(detail.includes(value));
  assert.match(detail, /target="_blank"/);
  assert.match(detail, /rel="noopener noreferrer"/);
});

test("hard delete appears only in the lower danger zone and keeps the existing remover", () => {
  assert.match(detail, /AdminDangerZone title="Sponsor dauerhaft löschen"/);
  assert.match(detail, /SponsorDeleteButton/);
  assert.doesNotMatch(list, /removeSponsorRecord|AdminRemoveButton|Löschen|Archivieren/);
  assert.doesNotMatch(detail, /archivier/i);
});

test("create, edit, upload, links, status and sorting write paths stay intact", () => {
  for (const value of ["saveSponsor(form", "uploadSponsorImage", "description_en", "website_url", "is_active", "sort_order", "revalidatePublicContentAction"]) assert.ok(form.includes(value));
  assert.match(upload, /AdminImageUpload/);
  assert.match(upload, /object-contain/);
  assert.match(service, /uploadMediaFile/);
  assert.match(service, /sort_order: Number\(sponsor\.sort_order \|\| 0\)/);
  assert.doesNotMatch(service, /drag/i);
});

test("queries, permissions, navigation and public sponsor rendering remain anchored", () => {
  assert.match(overviewPage, /\.from\("sponsors"\)\.select\("\*, sponsor_categories\(name_de\)"\)\.order\("sort_order"/);
  assert.match(list, /sponsors\.create/);
  assert.match(list, /sponsors\.edit/);
  assert.match(detail, /sponsors\.delete/);
  assert.match(publicBanner, /sponsor\.image_url/);
});
