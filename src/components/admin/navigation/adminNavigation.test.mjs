import test from "node:test";
import assert from "node:assert/strict";
import { ADMIN_NAVIGATION_SECTIONS } from "./adminNavigation.config.js";
import { findActiveNavigationEntry } from "./adminNavigation.matching.js";
import { resolveAdminNavigation } from "./adminNavigation.resolver.js";

const activeItems = ADMIN_NAVIGATION_SECTIONS.flatMap((section) =>
  section.items.filter((item) => item.implementationStatus === "active"),
);
const allPermissions = [...new Set(activeItems.flatMap((item) => [
  item.permissionKey, ...(item.permissionKeys || []), ...(item.writePermissionKeys || []),
]).filter(Boolean))];
const globalScope = { isGlobal: true, roleScopeTypes: ["global"], assignedTeamIds: [] };

function dto(permissionKeys, scopeContext = globalScope, currentPath = "/admin") {
  return resolveAdminNavigation({ sections: ADMIN_NAVIGATION_SECTIONS, permissionKeys, scopeContext, currentPath });
}

function itemKeys(result) {
  return result.sections.flatMap((section) => section.items.map((item) => item.key));
}

function assertUnique(values) {
  assert.equal(new Set(values).size, values.length);
}

test("configuration keys, hrefs and ordering are stable and unique", () => {
  assertUnique(ADMIN_NAVIGATION_SECTIONS.map((section) => section.key));
  assertUnique(ADMIN_NAVIGATION_SECTIONS.flatMap((section) => section.items.map((item) => item.key)));
  assertUnique(activeItems.map((item) => item.href));
  for (const section of ADMIN_NAVIGATION_SECTIONS) assertUnique(section.items.map((item) => item.order));
});

test("active items are valid admin routes with permission metadata", () => {
  for (const item of activeItems) {
    assert.match(item.href, /^\/admin(?:\/|$)/);
    assert.ok(item.permissionKey || item.permissionKeys?.length);
  }
});

test("planned items are never clickable", () => {
  const planned = ADMIN_NAVIGATION_SECTIONS.flatMap((section) => section.items)
    .filter((item) => item.implementationStatus === "planned");
  assert.ok(planned.length > 0);
  assert.ok(planned.every((item) => item.href === null));
});

test("all active permitted modules resolve for a global context", () => {
  assert.deepEqual(itemKeys(dto(allPermissions)).sort(), activeItems.map((item) => item.key).sort());
});

test("cashier permissions expose contributions but no team or player links", () => {
  const result = dto(["dashboard.view", "contributions.view", "contributions.edit"]);
  assert.ok(itemKeys(result).includes("contributions"));
  assert.ok(!itemKeys(result).includes("teams"));
  assert.ok(!itemKeys(result).includes("players"));
});

test("a context without permissions receives no empty sections", () => {
  assert.deepEqual(dto([], { roleScopeTypes: [], assignedTeamIds: [] }).sections, []);
});

test("board permissions retain existing club and football reachability", () => {
  const result = dto(["dashboard.view", "news.view", "teams.view", "players.view", "contributions.view"], {
    roleScopeTypes: ["own_board_card", "read_only"], assignedTeamIds: [],
  });
  assert.ok(itemKeys(result).includes("news"));
  assert.ok(itemKeys(result).includes("teams"));
  assert.ok(itemKeys(result).includes("players"));
  assert.equal(result.sections.flatMap((s) => s.items).find((i) => i.key === "contributions").isReadOnly, true);
});

test("trainer with assigned scope sees permitted football targets but no system", () => {
  const result = dto(["dashboard.view", "teams.view", "players.view"], {
    roleScopeTypes: ["own_staff_card"], assignedTeamIds: ["team-1"],
  });
  assert.ok(itemKeys(result).includes("teams"));
  assert.ok(itemKeys(result).includes("players"));
  assert.ok(!itemKeys(result).includes("users"));
});

test("caretaker and guest contexts expose only explicitly permitted items", () => {
  const caretaker = dto(["dashboard.view", "events.view", "teams.view"], {
    roleScopeTypes: ["own_staff_card"], assignedTeamIds: ["team-1"],
  });
  assert.deepEqual(itemKeys(caretaker).sort(), ["dashboard", "events", "teams"]);
  const guest = dto(["dashboard.view", "news.view", "events.view"], {
    roleScopeTypes: ["read_only"], assignedTeamIds: [],
  });
  assert.deepEqual(itemKeys(guest).sort(), ["dashboard", "events", "news"]);
});

test("department navigation follows the route guard permission and board scope", () => {
  const allowed = dto(["settings.view"], { roleScopeTypes: ["own_board_card"] });
  assert.ok(itemKeys(allowed).includes("department"));
  assert.ok(!itemKeys(dto(["system.view"], { isGlobal: true })).includes("department"));
});

test("scope-less trainer receives no false team links or empty football section", () => {
  const result = dto(["dashboard.view", "teams.view", "players.view"], {
    roleScopeTypes: ["own_staff_card"], assignedTeamIds: [],
  });
  assert.ok(!itemKeys(result).includes("teams"));
  assert.ok(!result.sections.some((section) => section.key === "football"));
});

test("youth scope exposes permitted football modules without department scope", () => {
  const result = dto(["dashboard.view", "teams.view", "players.view", "coaches.view"], {
    canAccessYouthAll: true, roleScopeTypes: ["youth_all"], assignedTeamIds: [],
  });
  assert.ok(["teams", "players", "coaches"].every((key) => itemKeys(result).includes(key)));
  assert.ok(!result.sections.some((section) => section.key === "table_tennis"));
});

test("planned modules are absent by default and non-clickable behind the development flag", () => {
  assert.ok(dto(allPermissions).sections.every((section) => section.items.every((item) => item.status === "active")));
  const development = resolveAdminNavigation({ sections: ADMIN_NAVIGATION_SECTIONS,
    permissionKeys: allPermissions, scopeContext: globalScope, featureFlags: { includePlanned: true } });
  const planned = development.sections.flatMap((section) => section.items).filter((item) => item.status === "planned");
  assert.ok(planned.length > 0);
  assert.ok(planned.every((item) => item.href === null));
});

test("route matching covers details and avoids similar prefixes", () => {
  const cases = new Map([
    ["/admin", "dashboard"], ["/admin/players", "players"],
    ["/admin/players/new", "players"], ["/admin/players/test-id", "players"],
    ["/admin/teams", "teams"], ["/admin/teams/test-id", "teams"], ["/admin/coaches", "coaches"],
    ["/admin/contributions", "contributions"], ["/admin/contributions/test-id", "contributions"],
    ["/admin/news", "news"], ["/admin/events", "events"], ["/admin/settings", "settings"],
    ["/admin/playerstats", null], ["/admin/unknown", null], ["/unknown", null],
  ]);
  for (const [path, expected] of cases) {
    assert.equal(findActiveNavigationEntry(ADMIN_NAVIGATION_SECTIONS, path).itemKey, expected);
  }
});

test("longest route prefix wins and only one item is active", () => {
  const sections = [{ key: "x", items: [
    { key: "short", href: "/admin/a", matchPrefixes: ["/admin/a"] },
    { key: "long", href: "/admin/a/b", matchPrefixes: ["/admin/a/b"] },
  ] }];
  assert.equal(findActiveNavigationEntry(sections, "/admin/a/b/1").itemKey, "long");
  const result = dto(allPermissions, globalScope, "/admin/players/new");
  assert.equal(result.sections.flatMap((s) => s.items).filter((item) => item.isActive).length, 1);
});

test("runtime DTO is serializable and contains no functions or secrets", () => {
  const result = dto(allPermissions);
  const serialized = JSON.stringify(result);
  assert.deepEqual(JSON.parse(serialized), result);
  assert.ok(!serialized.includes("service_role"));
  assert.ok(!serialized.includes("permissionKeys"));
  const walk = (value) => {
    assert.notEqual(typeof value, "function");
    if (value && typeof value === "object") Object.values(value).forEach(walk);
  };
  walk(result);
});
