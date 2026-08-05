import test from "node:test";
import assert from "node:assert/strict";
import { buildEventNotification, getEventNotificationPlan, getRelevantEventChanges, resolveEditorialTarget } from "./editorialNotification.core.mjs";

const event = { id: "event-1", slug: "spiel", title_de: "Freundschaftsspiel", team_id: "team-1", starts_at: "2026-08-29T09:00:00.000Z", is_published: true, updated_at: "2026-08-05T10:00:00.000Z" };

test("only persisted team events create a notification plan", () => {
  assert.equal(getEventNotificationPlan(null, { ...event, team_id: null }), null);
  assert.deepEqual(getEventNotificationPlan(null, event), { type: "event_created", teamIds: ["team-1"], changes: ["created"] });
});

test("unchanged saves produce no notification", () => {
  assert.deepEqual(getRelevantEventChanges(event, { ...event }), []);
  assert.equal(getEventNotificationPlan(event, { ...event }), null);
});

test("relevant updates and team changes address old and new teams", () => {
  const next = { ...event, team_id: "team-2", starts_at: "2026-08-30T09:00:00.000Z" };
  const plan = getEventNotificationPlan(event, next);
  assert.equal(plan.type, "event_updated");
  assert.deepEqual(plan.teamIds, ["team-1", "team-2"]);
  assert.deepEqual(plan.changes.sort(), ["starts_at", "team_id"]);
});

test("event metadata is minimal and contains no html or contact data", () => {
  const result = buildEventNotification("event_updated", event, { teamId: "team-1", teamName: "D2", changes: ["starts_at"] });
  assert.match(result.message, /Freundschaftsspiel/);
  assert.equal(result.metadata.teamName, "D2");
  for (const key of ["description_de", "email", "phone", "internal_note", "content"]) assert.equal(key in result.metadata, false);
});

test("targets use an authorized edit route, public route, or notification detail", () => {
  const result = buildEventNotification("event_updated", event, {});
  assert.equal(resolveEditorialTarget({ permissionKeys: ["events.edit"] }, result), "/admin/events/edit/event-1");
  assert.equal(resolveEditorialTarget({ permissionKeys: [] }, result), "/termine/spiel");
  assert.equal(resolveEditorialTarget({ permissionKeys: [] }, { ...result, metadata: { ...result.metadata, isPublished: false } }), "/admin/notifications");
});
