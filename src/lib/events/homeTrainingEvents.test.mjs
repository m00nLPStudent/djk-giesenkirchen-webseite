import assert from "node:assert/strict";
import test from "node:test";
import {
  HOME_TRAINING_LIMIT,
  selectUpcomingHomeTrainings,
} from "./homeTrainingEvents.mjs";

const training = (id, startsAt) => ({
  id,
  starts_at: startsAt,
  is_virtual: true,
  source_type: "team_training",
});

test("home trainings keep only future virtual team trainings in chronological order", () => {
  const result = selectUpcomingHomeTrainings(
    [
      training("later", "2026-09-02T18:00:00.000Z"),
      { ...training("event", "2026-09-01T17:00:00.000Z"), is_virtual: false },
      training("past", "2026-08-31T18:00:00.000Z"),
      training("next", "2026-09-01T18:00:00.000Z"),
    ],
    { now: new Date("2026-09-01T12:00:00.000Z") },
  );

  assert.deepEqual(result.map((item) => item.id), ["next", "later"]);
});

test("home trainings use the bounded default limit", () => {
  const events = Array.from({ length: 8 }, (_, index) =>
    training(`training-${index}`, `2026-09-0${index + 1}T18:00:00.000Z`),
  );
  assert.equal(selectUpcomingHomeTrainings(events, { now: new Date("2026-09-01T00:00:00.000Z") }).length, HOME_TRAINING_LIMIT);
});

test("home trainings merge teams globally before applying the limit", () => {
  const result = selectUpcomingHomeTrainings(
    [
      training("team-a-15", "2026-09-15T18:00:00.000Z"),
      training("team-a-01", "2026-09-01T18:00:00.000Z"),
      training("team-b-09", "2026-09-09T18:00:00.000Z"),
      training("team-a-08", "2026-09-08T18:00:00.000Z"),
      training("team-c-03", "2026-09-03T18:00:00.000Z"),
      training("team-b-02", "2026-09-02T18:00:00.000Z"),
    ],
    { now: new Date("2026-09-01T00:00:00.000Z") },
  );

  assert.deepEqual(result.map((item) => item.id), [
    "team-a-01",
    "team-b-02",
    "team-c-03",
    "team-a-08",
    "team-b-09",
  ]);
});

test("a nearer Bambini occurrence is never displaced by later E1 recurrences", () => {
  const result = selectUpcomingHomeTrainings(
    [
      training("e1-22", "2026-09-22T17:00:00.000Z"),
      training("e1-15", "2026-09-15T17:00:00.000Z"),
      training("e1-08", "2026-09-08T17:00:00.000Z"),
      training("bambini-02", "2026-09-02T17:00:00.000Z"),
      training("e1-01", "2026-09-01T17:00:00.000Z"),
    ],
    { now: new Date("2026-09-01T00:00:00.000Z") },
  );

  assert.deepEqual(result.map((item) => item.id), [
    "e1-01",
    "bambini-02",
    "e1-08",
    "e1-15",
    "e1-22",
  ]);
});

test("home trainings return a stable empty collection", () => {
  assert.deepEqual(selectUpcomingHomeTrainings([], { now: new Date("2026-09-01T00:00:00.000Z") }), []);
});
