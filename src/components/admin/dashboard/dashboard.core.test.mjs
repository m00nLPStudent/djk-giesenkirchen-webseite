import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildDashboardNotices, buildDashboardQuickLinks, buildRecentItems,
  canOpenMembershipRequestTarget, canViewMembershipRequestsOnDashboard,
  createDashboardDto, createDashboardQueryPlan, resolveDashboardDisplayName,
  loadMembershipRequestCountForDashboard, resolveDashboardIntro, resolveGreeting,
} from "./dashboard.core.js";

test("greeting follows the required day boundaries", () => {
  assert.equal(resolveGreeting(8), "Guten Morgen");
  assert.equal(resolveGreeting(11.59), "Guten Morgen");
  assert.equal(resolveGreeting(12), "Guten Tag");
  assert.equal(resolveGreeting(17.59), "Guten Tag");
  assert.equal(resolveGreeting(18), "Guten Abend");
});

test("display name uses explicit, first and full-name fallbacks without invention", () => {
  assert.equal(resolveDashboardDisplayName({ display_name: "Swen Admin" }), "Swen");
  assert.equal(resolveDashboardDisplayName({ first_name: "Mary" }), "Mary");
  assert.equal(resolveDashboardDisplayName({ full_name: "Alex Beispiel" }), "Alex");
  assert.equal(resolveDashboardDisplayName({}), null);
});

test("intro derives from permissions and scopes instead of role names", () => {
  assert.match(resolveDashboardIntro({ scopeContext: { isGlobal: true } }), /gesamten CMS/);
  assert.match(resolveDashboardIntro({ scopeContext: { canAccessYouthAll: true } }), /Jugendmannschaften/);
  assert.match(resolveDashboardIntro({ scopeContext: { assignedTeamIds: ["x"] } }), /deine Mannschaften/);
  assert.match(resolveDashboardIntro({ permissionKeys: ["contributions.view"], navigation: { sections: [{ items: [{}, {}] }] } }), /Beitragsfälle/);
  assert.match(resolveDashboardIntro({ permissionKeys: ["settings.view"] }), /Vereinsinformationen/);
});

test("query plan gates every domain query by an existing permission", () => {
  assert.deepEqual(createDashboardQueryPlan([]), { profile: true, contributions: false, events: false, news: false, membershipRequests: false, teams: false });
  const finance = createDashboardQueryPlan(["contributions.view"]);
  assert.equal(finance.contributions, true);
  assert.equal(finance.news, false);
  assert.equal(finance.teams, false);
  const editor = createDashboardQueryPlan(["news.view", "events.view", "settings.view"]);
  assert.equal(editor.news, true);
  assert.equal(editor.events, true);
  assert.equal(editor.membershipRequests, false);
});

test("notices contain only computed positive counts and have reachable targets", () => {
  assert.deepEqual(buildDashboardNotices({}), []);
  const notices = buildDashboardNotices({ contributionSummary: { overdueCount: 2, openCount: 3 }, membershipOpenCount: 1, membershipTargetAvailable: true });
  assert.deepEqual(notices.map((item) => item.count), [2, 3, 1]);
  assert.ok(notices.every((item) => item.href.startsWith("/admin/")));
});

test("membership dashboard policy allows only approved server contexts", () => {
  const withMembership = ["membership_requests.view", "settings.view"];
  assert.equal(canViewMembershipRequestsOnDashboard({ permissionKeys: withMembership, roleKeys: ["superadmin"], scopeContext: { isGlobal: true } }), true);
  assert.equal(canViewMembershipRequestsOnDashboard({ permissionKeys: withMembership, roleKeys: ["vorstand"] }), true);
  assert.equal(canViewMembershipRequestsOnDashboard({ roleKeys: ["jugendleiter"], scopeContext: { canAccessYouthAll: true } }), true);
  assert.equal(canViewMembershipRequestsOnDashboard({ roleKeys: ["jugendkoordinator"] }), true);
  for (const role of ["kassierer", "trainer", "betreuer", "gast"]) {
    assert.equal(canViewMembershipRequestsOnDashboard({ permissionKeys: withMembership, roleKeys: [role] }), false);
  }
});

test("membership query and target link are decided independently before loading", () => {
  const cashierPlan = createDashboardQueryPlan(["membership_requests.view", "settings.view"], { roleKeys: ["kassierer"], scopeContext: { roleScopeTypes: ["own_board_card"] } });
  const youthPlan = createDashboardQueryPlan([], { roleKeys: ["jugendleiter"], scopeContext: { canAccessYouthAll: true } });
  assert.equal(cashierPlan.membershipRequests, false);
  assert.equal(youthPlan.membershipRequests, true);
  assert.equal(canOpenMembershipRequestTarget({ permissionKeys: [], scopeContext: { canAccessYouthAll: true } }), true);
  assert.equal(canOpenMembershipRequestTarget({ roleKeys: ["superadmin"] }), true);
});

test("membership query gate never calls the loader for an unauthorized context", async () => {
  let calls = 0;
  const loadCount = async () => { calls += 1; return 7; };
  assert.equal(await loadMembershipRequestCountForDashboard({ allowed: false, loadCount }), 0);
  assert.equal(calls, 0);
  assert.equal(await loadMembershipRequestCountForDashboard({ allowed: true, loadCount }), 7);
  assert.equal(calls, 1);
});

test("membership notice contains only aggregate count and an optional safe target", () => {
  assert.ok(!buildDashboardNotices({ membershipOpenCount: 0 }).some((item) => item.key === "membership-open"));
  const withoutTarget = buildDashboardNotices({ membershipOpenCount: 4 }).find((item) => item.key === "membership-open");
  assert.deepEqual(withoutTarget, { key: "membership-open", tone: "info", count: 4, text: "offene Mitgliedsanfragen", href: null });
  assert.equal(buildDashboardNotices({ membershipOpenCount: 1, membershipTargetAvailable: true })[0].href, "/admin/membership-requests");
  const serialized = JSON.stringify(withoutTarget);
  for (const sensitive of ["id", "first_name", "last_name", "notes", "email"]) assert.ok(!serialized.includes(sensitive));
});

test("cashier membership restriction does not affect contribution planning", () => {
  const plan = createDashboardQueryPlan(["membership_requests.view", "settings.view", "contributions.view"], { roleKeys: ["kassierer"] });
  assert.equal(plan.membershipRequests, false);
  assert.equal(plan.contributions, true);
});

test("quick links reuse only active runtime navigation items", () => {
  const navigation = { sections: [{ label: "Fußball", items: [
    { key: "teams", label: "Teams", href: "/admin/teams", icon: "shield", status: "active" },
    { key: "planned", label: "Plan", href: null, icon: "shield", status: "planned" },
  ] }] };
  assert.deepEqual(buildDashboardQuickLinks(navigation).map((item) => item.key), ["teams"]);
  assert.deepEqual(buildDashboardQuickLinks({ sections: [] }), []);
});

test("recent items are bounded, sortable and may safely be empty", () => {
  assert.deepEqual(buildRecentItems(), []);
  const items = buildRecentItems({ news: [{ id: "1", title: "News", updatedAt: "2026-01-02", href: "/admin/news" }], events: [{ id: "2", title: "Termin", updatedAt: "2026-01-03", href: "/admin/events" }] });
  assert.deepEqual(items.map((item) => item.module), ["Termine", "News"]);
});

test("dashboard DTO is serializable and excludes secrets and payment details", () => {
  const dto = createDashboardDto({ greeting: { text: "Guten Tag", displayName: null, intro: "Hallo" }, contributionSummary: { openCount: 2 } });
  const serialized = JSON.stringify(dto);
  assert.deepEqual(JSON.parse(serialized), dto);
  for (const forbidden of ["service_role", "assignedTeamIds", "paymentHistory", "internalReason"]) assert.ok(!serialized.includes(forbidden));
});

test("dashboard markup stays compact, responsive and below the canonical layout", () => {
  const shell = readFileSync(new URL("./DashboardPageShell.js", import.meta.url), "utf8");
  assert.match(shell, /xl:grid-cols/);
  assert.match(shell, /min-w-0/);
  assert.match(shell, /data-dashboard-layout="compact-workspace"/);
  assert.doesNotMatch(shell, /DashboardStatGrid|DashboardStatCard|overflow-x-auto/);
});
