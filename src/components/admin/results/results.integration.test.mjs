import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const page = read("../../../app/admin/results/page.js");
const actions = read("../../../app/admin/results/actions.js");
const service = read("./results.service.js");
const repository = read("./results.repository.js");
const ui = read("./ResultsModule.js");
const navigation = read("../navigation/adminNavigation.config.js");
const permissionConfig = read("../../../lib/admin-auth/adminPermissionConfig.js");
const mediaCore = read("../media-library/mediaAssignment.core.mjs");

test("results route and navigation require results.view", () => {
  assert.match(page, /requiredPermission: "results\.view"/);
  assert.match(navigation, /"results"[\s\S]*"\/admin\/results"[\s\S]*"results\.view"/);
  assert.match(permissionConfig, /buildRule\("\/admin\/results", "results\.view"/);
});

test("all result mutations use their granular permission guards", () => {
  for (const permission of ["results.create", "results.edit", "results.delete", "results.publish"]) assert.match(actions, new RegExp(permission.replace(".", "\\.")));
  assert.match(service, /current\.data\?\.is_published !== value\.isPublished[\s\S]*results\.publish/);
});

test("server service checks current and target team-season scope", () => {
  assert.match(service, /resolveScopedResult\(db, auth, value\.id\)/);
  assert.match(service, /resolveScopedTeamSeason\(db, auth, value\.teamSeasonId\)/);
  assert.match(service, /canAccessResultTeamSeason\(scope\.context, result\.data\)/);
  assert.match(repository, /team_seasons\(id,name_de,is_active,season_id,teams\(id,name_de,is_active,department_id,departments\(id,slug,name_de,is_active\)\)/);
});

test("results use service role repositories and do not expose a browser database client", () => {
  assert.match(service, /createSupabaseAdminClient/);
  assert.match(repository, /import "server-only"/);
  assert.doesNotMatch(ui, /createClient|supabase|service_role/i);
});

test("opponent logo is optional and uses the result media assignment contract", () => {
  assert.match(service, /synchronizeMediaAssignment\("result", saved\.data\.id, value\.opponentLogoMediaAssetId, "opponent_logo"\)/);
  assert.match(mediaCore, /"result"/);
  assert.match(mediaCore, /"opponent_logo"/);
  assert.match(ui, /Gegnerlogo \(optional\)/);
});

test("UI provides scoped filters, accessible labels and permission-granular actions", () => {
  assert.match(ui, /Sportart filtern/);
  assert.match(ui, /Mannschaft filtern/);
  assert.match(ui, /Status filtern/);
  for (const permission of ["results.create", "results.edit", "results.delete", "results.publish"]) assert.match(ui, new RegExp(`permission="${permission.replace(".", "\\.")}"`));
  assert.match(ui, /Standard: Das Ergebnis wird ab Spielbeginn sieben Tage angezeigt/);
});

test("successful mutations also revalidate the public results header", () => {
  assert.match(actions, /revalidatePublicContent\("results"\)/);
});
