import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createEventDto, createEventDtos, resolveEventTypeLabel, UNKNOWN_EVENT_TYPE_LABEL } from "./helpers/eventTypes.core.js";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const eventTypes = [
  { id: "2", slug: "turnier", name_de: "Turnier", is_active: true, sort_order: 20 },
  { id: "1", slug: "training", name_de: "Training", is_active: true, sort_order: 10 },
];

test("labels resolve centrally with a safe fallback", () => {
  assert.equal(resolveEventTypeLabel(eventTypes, "training"), "Training");
  assert.equal(resolveEventTypeLabel(eventTypes, "legacy"), UNKNOWN_EVENT_TYPE_LABEL);
});

test("event DTO exposes key and resolved label", () => {
  const dto = createEventDto({ id: "1", title_de: "Test", event_type: "turnier", starts_at: "2026-08-03T10:00:00Z" }, eventTypes);
  assert.equal(dto.eventTypeKey, "turnier");
  assert.equal(dto.eventTypeLabel, "Turnier");
  assert.equal(dto.title, "Test");
  assert.equal(dto.startsAt, "2026-08-03T10:00:00Z");
});

test("one preloaded map resolves mixed and historical lists", () => {
  const dtos = createEventDtos([{ event_type: "training" }, { event_type: "removed" }], eventTypes);
  assert.deepEqual(dtos.map((item) => item.eventTypeLabel), ["Training", UNKNOWN_EVENT_TYPE_LABEL]);
});

test("repository owns active filtering and sort order", () => {
  const source = read("./services/eventTypes.repository.js");
  assert.match(source, /from\("event_types"\)/);
  assert.match(source, /order\("sort_order", \{ ascending: true \}\)/);
  assert.match(source, /activeOnly = true/);
  assert.match(source, /eq\("is_active", true\)/);
});

test("forms and public cards consume supplied central data", () => {
  const form = read("./forms/tabs/EventTimeTab.js");
  const publicCards = [read("../../website/events/EventCard.js"), read("../../website/events/HomeEventsSection.js")].join("\n");
  assert.match(form, /eventTypes\.map/);
  assert.doesNotMatch(form, /EVENT_TYPES/);
  assert.match(publicCards, /event\.eventTypeLabel/);
  assert.doesNotMatch(publicCards, /getEventTypeLabel|event\.event_type/);
});

test("event-type mutations revalidate existing public event routes", () => {
  const actions = read("../../../app/admin/settings/categories/actions.js");
  assert.match(actions, /groupKey === "events"/);
  assert.match(actions, /revalidatePublicContent\("events"\)/);
});
