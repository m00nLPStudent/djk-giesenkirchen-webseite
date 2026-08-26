import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const sources = Object.freeze({
  news: read("../../../app/admin/news/actions.js"),
  events: read("../../../app/admin/events/actions.js"),
  history: read("../../../app/admin/club-history/actions.js"),
});
const dates = read("../../../lib/dates.js");
const historyForm = read("../club-history/forms/ClubHistoryEditorForm.js");

test("each save path checks its existing edit/create permission and publish permission", () => {
  assert.match(sources.news, /newsId \? "news\.edit" : "news\.create"/);
  assert.match(sources.news, /requiresPublishPermission\(existing, payload[\s\S]*requiredPermission: "news\.publish"/);
  assert.match(sources.events, /eventId \? "events\.edit" : "events\.create"/);
  assert.match(sources.events, /requiresPublishPermission\(previous, payload\)[\s\S]*requiredPermission: "events\.publish"/);
  assert.match(sources.history, /requiredPermission: "club_history\.edit"/);
  assert.match(sources.history, /requiresPublishPermission\(previous, payload[\s\S]*requiredPermission: "club_history\.publish"/);
});

test("old publish state is loaded server-side before the additional check", () => {
  assert.match(sources.news, /select\("id, author, image_url, image_media_asset_id, content_de, is_published, published_at"\)[\s\S]*requiresPublishPermission/);
  assert.match(sources.events, /from\("events"\)\.select\("\*"\)[\s\S]*requiresPublishPermission/);
  assert.match(sources.history, /select\("id,is_published,published_at"\)[\s\S]*requiresPublishPermission/);
  for (const source of Object.values(sources)) assert.match(source, /supabaseServer:/);
});

test("event writes use the admin client only after user authorization", () => {
  assert.match(sources.events, /saveEventWithNotificationAction[\s\S]*assertAdminActionPermission[\s\S]*createSupabaseAdminClient\(\)[\s\S]*from\("events"\)\.update/);
  assert.match(sources.events, /requiredPermission: "events\.publish", supabaseServer: auth\.supabaseServer/);
});

test("news and history datetime-local inputs preserve the browser-local instant", () => {
  assert.match(dates, /getFullYear\(\)[\s\S]*getMonth\(\)[\s\S]*getHours\(\)[\s\S]*getMinutes\(\)/);
  assert.doesNotMatch(dates, /toISOString\(\)\.slice\(0, 16\)/);
  assert.match(historyForm, /formatDateTimeLocalInput\(page\?\.published_at\)/);
  assert.doesNotMatch(historyForm, /toISOString\(\)\.slice\(0, 16\)/);
});

test("media document and child-entity permissions stay on their existing edit paths", () => {
  assert.match(sources.news, /authorizeNewsMedia[\s\S]*newsId \? "news\.edit" : "news\.create"/);
  assert.match(sources.events, /authorizeEventMedia[\s\S]*eventId \? "events\.edit" : "events\.create"/);
  for (const action of ["createClubHistoryMilestoneAction", "updateClubHistoryMilestoneAction", "createClubHistoryImageAction", "updateClubHistoryImageAction"]) assert.match(sources.history, new RegExp(`export async function ${action}`));
});
