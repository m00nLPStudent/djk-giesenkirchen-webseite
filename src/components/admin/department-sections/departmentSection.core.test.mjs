import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeDepartmentSectionPayload,
  normalizeDepartmentTrainingPayload,
} from "./departmentSection.core.mjs";

test("section validation keeps German content and requires meaningful public contact", () => {
  const valid = normalizeDepartmentSectionPayload({
    title_de: " Behindertensport ", description_de: " Angebot ",
    contact_name: " Beispiel ", contact_email: "kontakt@example.test",
    contact_is_public: true, is_active: true, is_published: false,
  });
  assert.equal(valid.ok, true);
  assert.equal(valid.data.title_de, "Behindertensport");
  assert.equal(valid.data.description_de, "Angebot");
  assert.equal(normalizeDepartmentSectionPayload({ title_de: "Bereich", contact_is_public: true }).ok, false);
  assert.equal(normalizeDepartmentSectionPayload({ title_de: "Bereich", contact_email: "ungueltig" }).ok, false);
});

test("private optional contact and empty description remain valid", () => {
  const result = normalizeDepartmentSectionPayload({ title_de: "Bereich", contact_is_public: false });
  assert.equal(result.ok, true);
  assert.equal(result.data.contact_name, null);
  assert.equal(result.data.description_de, "");
});

test("training validation accepts multiple slots without team or season fields", () => {
  const result = normalizeDepartmentTrainingPayload({
    weekday: 3, start_time: "18:00", end_time: "19:30",
    location_name: "Halle", effective_from: "2026-01-01", effective_until: "2026-12-31",
  });
  assert.equal(result.ok, true);
  assert.equal(result.data.weekday, 3);
  assert.equal(Object.hasOwn(result.data, "department_id"), false);
  assert.equal(Object.hasOwn(result.data, "team_season_id"), false);
});

test("training validation rejects weekday, time and validity violations", () => {
  assert.equal(normalizeDepartmentTrainingPayload({ weekday: 0, start_time: "18:00", end_time: "19:00" }).ok, false);
  assert.equal(normalizeDepartmentTrainingPayload({ weekday: 1, start_time: "19:00", end_time: "18:00" }).ok, false);
  assert.equal(normalizeDepartmentTrainingPayload({ weekday: 1, start_time: "18:00", end_time: "19:00", effective_from: "2026-05-02", effective_until: "2026-05-01" }).ok, false);
});
