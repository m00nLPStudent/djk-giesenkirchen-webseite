import assert from "node:assert/strict";
import test from "node:test";
import { applyClubClosurePeriods } from "./closurePeriods.js";
import {
  mergeTrainingOccurrenceStreams,
  selectPublishedDepartmentTrainingSlots,
} from "./departmentTrainingEvents.mjs";
import { getTrainingOccurrences } from "./virtualTraining.js";

const department = { id: "disabled", slug: "behindertensport", name_de: "Behindertensport", is_active: true };
const section = { department_id: "disabled", title_de: "Inklusiv aktiv", is_active: true, is_published: true };
const training = { id: "training-1", department_id: "disabled", weekday: 2, start_time: "18:00:00", end_time: "19:00:00", location_name: "Sporthalle", location_address: "Teststraße 1", location_city: "Mönchengladbach", location_note: "Bitte Hallenschuhe mitbringen", effective_from: null, effective_until: null, is_active: true };

test("published department training becomes a neutral concrete occurrence", () => {
  const slots = selectPublishedDepartmentTrainingSlots([training], [department], [section]);
  const occurrences = getTrainingOccurrences(slots, {
    from: new Date(2026, 8, 7),
    to: new Date(2026, 8, 13),
  });

  assert.equal(occurrences.length, 1);
  assert.equal(occurrences[0].source_type, "department_training");
  assert.equal(occurrences[0].department_slug, "behindertensport");
  assert.equal(occurrences[0].title_de, "Inklusiv aktiv");
  assert.equal(occurrences[0].team_id, null);
  assert.equal(occurrences[0].team_season_id, null);
  assert.equal(occurrences[0].location_name, "Sporthalle");
  assert.equal(occurrences[0].starts_at, new Date(2026, 8, 8, 18, 0).toISOString());
});

test("department name is the safe display fallback and internal slug is never the title", () => {
  const [slot] = selectPublishedDepartmentTrainingSlots([training], [department], [{ ...section, title_de: " " }]);
  assert.equal(slot.display_name_de, "Behindertensport");
  assert.equal(slot.department_href, "/behindertensport");
});

test("inactive, unpublished, foreign and malformed source records fail closed", () => {
  assert.deepEqual(selectPublishedDepartmentTrainingSlots([{ ...training, is_active: false }], [department], [section]), []);
  assert.deepEqual(selectPublishedDepartmentTrainingSlots([training], [{ ...department, is_active: false }], [section]), []);
  assert.deepEqual(selectPublishedDepartmentTrainingSlots([training], [department], [{ ...section, is_active: false }]), []);
  assert.deepEqual(selectPublishedDepartmentTrainingSlots([training], [department], [{ ...section, is_published: false }]), []);
  assert.deepEqual(selectPublishedDepartmentTrainingSlots([{ ...training, department_id: "foreign" }], [department], [section]), []);
  assert.deepEqual(selectPublishedDepartmentTrainingSlots([training], [{ ...department, slug: "https://invalid.test" }], [section]), []);
});

test("effective date bounds constrain concrete department occurrences", () => {
  const future = { ...training, effective_from: "2026-09-15" };
  const expired = { ...training, effective_until: "2026-09-06" };
  const window = { from: new Date(2026, 8, 7), to: new Date(2026, 8, 13) };

  assert.deepEqual(getTrainingOccurrences(selectPublishedDepartmentTrainingSlots([future], [department], [section]), window), []);
  assert.deepEqual(getTrainingOccurrences(selectPublishedDepartmentTrainingSlots([expired], [department], [section]), window), []);
});

test("global club closures remove department occurrences without team-specific dummy data", () => {
  const slots = selectPublishedDepartmentTrainingSlots([training], [department], [section]);
  const occurrences = getTrainingOccurrences(slots, { from: new Date(2026, 8, 7), to: new Date(2026, 8, 13) });
  const result = applyClubClosurePeriods(occurrences, [{ starts_on: "2026-09-08", ends_on: "2026-09-08", applies_to_all: true, is_active: true }]);

  assert.deepEqual(result, []);
});

test("team and department occurrences are globally sorted before home limiting", () => {
  const merged = mergeTrainingOccurrenceStreams(
    [
      { id: "team-monday", starts_at: "2026-09-07T18:00:00.000Z" },
      { id: "team-wednesday", starts_at: "2026-09-09T18:00:00.000Z" },
      { id: "team-friday", starts_at: "2026-09-11T18:00:00.000Z" },
    ],
    [
      { id: "department-tuesday", starts_at: "2026-09-08T18:00:00.000Z" },
      { id: "department-thursday", starts_at: "2026-09-10T18:00:00.000Z" },
    ],
  );

  assert.deepEqual(merged.map(({ id }) => id), ["team-monday", "department-tuesday", "team-wednesday", "department-thursday", "team-friday"]);
});
