import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const page = read("../../../app/admin/events/page.js");
const editPage = read("../../../app/admin/events/edit/[id]/page.js");
const service = read("./services/events.service.js");
const helpers = read("./eventList.helpers.js");
const actions = read("../../../app/admin/events/actions.js");

test("admin overview authorizes and resolves scope before using the admin read client", () => {
  assert.match(page, /requiredPermission: "events\.view"[\s\S]*loadServerTeamScopeContext\(permissionResult\)[\s\S]*createSupabaseAdminClient\(\)[\s\S]*getAdminEvents\(adminClient\)/);
  assert.match(page, /scopedTrainings = virtualTrainings\.filter\(\(event\) => canAccessTeamOnServer\(scopeContext, event\)\)/);
});

test("admin event query includes drafts while public queries remain published-only", () => {
  const adminBlock = service.match(/export async function getAdminEvents[\s\S]*?\n}/)?.[0] || "";
  assert.match(adminBlock, /client[\s\S]*from\("events"\)[\s\S]*select\("\*"\)/);
  assert.doesNotMatch(adminBlock, /is_published/);
  for (const name of ["getPublishedEvents", "getPublishedEventBySlug", "getUpcomingPublishedEvents"]) {
    const start = service.indexOf(`export async function ${name}`);
    assert.ok(start >= 0);
    assert.match(service.slice(start, service.indexOf("\n}", start) + 2), /eq\("is_published", true\)/);
  }
});

test("draft detail read is authorized and no longer constrained by public RLS", () => {
  assert.match(editPage, /requiredPermission: "events\.edit"[\s\S]*if \(!auth\.ok\) redirect[\s\S]*createSupabaseAdminClient\(\)[\s\S]*adminClient\.from\("events"\)/);
});

test("draft planned and published classifications and counters remain intact", () => {
  assert.match(helpers, /admin_status: getEventStatusKey\(event, now\)/);
  assert.match(helpers, /published:[\s\S]*"veroeffentlicht"/);
  assert.match(helpers, /planned:[\s\S]*"geplant"/);
  assert.match(helpers, /drafts:[\s\S]*"entwurf"/);
});

test("J2 publish protection remains server-side and no browser write is introduced", () => {
  assert.match(actions, /requiredPermission: "events\.publish", supabaseServer: auth\.supabaseServer/);
  assert.match(actions, /createSupabaseAdminClient\(\)/);
  assert.doesNotMatch(page + editPage, /\.insert\(|\.update\(|\.delete\(/);
});
