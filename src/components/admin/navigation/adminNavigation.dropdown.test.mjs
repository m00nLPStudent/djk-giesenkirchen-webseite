import test from "node:test";
import assert from "node:assert/strict";
import { ADMIN_NAVIGATION_SECTIONS } from "./adminNavigation.config.js";
import { resolveAdminNavigation } from "./adminNavigation.resolver.js";
import { getNavigationDropdownLayout } from "./adminNavigation.uiCore.js";

const item = (key, status = "active") => ({ key, href: `/admin/${key}`, status });
const layout = (items) => getNavigationDropdownLayout(items).key;

test("dropdown layout follows the visible item count", () => {
  assert.equal(layout([]), "empty");
  assert.equal(layout([item("one")]), "compact-single");
  assert.equal(layout([item("one"), item("two")]), "compact-list");
  assert.equal(layout([item("one"), item("two"), item("three")]), "medium-layout");
  assert.equal(layout([item("one"), item("two"), item("three"), item("four")]), "medium-layout");
  assert.equal(layout([item("one"), item("two"), item("three"), item("four"), item("five")]), "mega-grid");
});

test("non-runtime statuses do not contribute to dropdown sizing", () => {
  const result = getNavigationDropdownLayout([
    item("active"), item("planned", "planned"), item("hidden", "hidden"), item("blocked", "blocked"),
  ]);
  assert.equal(result.key, "compact-single");
  assert.deepEqual(result.visibleItems.map(({ key }) => key), ["active"]);
});

function resolvedLayout(permissionKeys, scopeContext, sectionKey) {
  const dto = resolveAdminNavigation({ sections: ADMIN_NAVIGATION_SECTIONS, permissionKeys, scopeContext });
  const section = dto.sections.find(({ key }) => key === sectionKey);
  return section ? getNavigationDropdownLayout(section.items) : getNavigationDropdownLayout([]);
}

test("cashier football navigation is compact through permission-filtered items", () => {
  const result = resolvedLayout(["contributions.view"], {}, "football");
  assert.equal(result.key, "compact-single");
  assert.deepEqual(result.visibleItems.map(({ key }) => key), ["contributions"]);
});

test("superadmin club navigation keeps the existing mega grid", () => {
  const permissions = ["news.view", "events.view", "sponsors.view", "club_history.view", "settings.view", "users.view", "roles.view", "permissions.view"];
  const result = resolvedLayout(permissions, { isGlobal: true }, "club");
  assert.equal(result.itemCount, 9);
  assert.equal(result.key, "mega-grid");
});

test("permissions affect layout only through the resolver's visible item count", () => {
  const compact = resolvedLayout(["news.view", "events.view"], { isGlobal: true }, "club");
  const medium = resolvedLayout(["news.view", "events.view", "sponsors.view"], { isGlobal: true }, "club");
  assert.equal(compact.itemCount, 2);
  assert.equal(compact.key, "compact-list");
  assert.equal(medium.itemCount, 3);
  assert.equal(medium.key, "medium-layout");
});
