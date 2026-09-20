import assert from "node:assert/strict";
import test from "node:test";
import {
  HOME_TRAINING_LIMIT,
  selectUpcomingHomeTrainings,
} from "./homeTrainingEvents.mjs";

const training = (id, startsAt, sourceType = "team_training") => ({
  id,
  starts_at: startsAt,
  is_virtual: true,
  source_type: sourceType,
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
  const events = Array.from({ length: 12 }, (_, index) =>
    training(
      `training-${index}`,
      new Date(Date.UTC(2026, 8, index + 1, 18)).toISOString(),
    ),
  );
  assert.equal(HOME_TRAINING_LIMIT, 10);
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
    "team-a-15",
  ]);
});

test("department occurrences participate in the same global top-ten limit", () => {
  const result = selectUpcomingHomeTrainings(
    [
      training("team-monday", "2026-09-07T18:00:00.000Z"),
      training("team-wednesday", "2026-09-09T18:00:00.000Z"),
      training("team-friday", "2026-09-11T18:00:00.000Z"),
      training("department-tuesday", "2026-09-08T18:00:00.000Z", "department_training"),
      training("department-thursday", "2026-09-10T18:00:00.000Z", "department_training"),
      training("later", "2026-09-12T18:00:00.000Z"),
    ],
    { now: new Date("2026-09-07T00:00:00.000Z") },
  );

  assert.deepEqual(result.map(({ id }) => id), ["team-monday", "department-tuesday", "team-wednesday", "department-thursday", "team-friday", "later"]);
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
