import test from "node:test";
import assert from "node:assert/strict";
import { getTrainingExceptionPlan, getTrainingTimePlan, normalizeTrainingExceptionPayload, normalizeTrainingTimePayload } from "./trainingMutation.core.mjs";

const time = { id: "time-1", team_season_id: "season-1", weekday: 1, start_time: "17:00", end_time: "18:45", training_type: "training", location_name: "Platz", is_active: true };

test("training time plans cover create update delete and suppress unchanged saves", () => {
  assert.equal(getTrainingTimePlan(null, time).action, "created");
  assert.equal(getTrainingTimePlan(time, { ...time }), null);
  assert.deepEqual(getTrainingTimePlan(time, { ...time, weekday: 3 }).changedFields, ["weekday"]);
  assert.equal(getTrainingTimePlan(time, null).action, "removed");
});

test("normalization preserves the existing training defaults and fields", () => {
  const result = normalizeTrainingTimePayload({ team_season_id: "season-1", weekday: 0, note: "intern" });
  assert.equal(result.weekday, 1);
  assert.equal(result.training_type, "training");
  assert.equal(result.note, "intern");
});

test("exception plans support only real cancelled and moved states", () => {
  const cancelled = { id: "ex-1", team_training_time_id: "time-1", exception_date: "2026-09-12", exception_type: "cancelled", is_active: true };
  assert.equal(getTrainingExceptionPlan(null, { ...cancelled, exception_date: null }), null);
  assert.equal(getTrainingExceptionPlan(null, cancelled).action, "cancelled");
  assert.equal(getTrainingExceptionPlan(cancelled, { ...cancelled, exception_type: "moved" }).action, "moved");
  assert.equal(getTrainingExceptionPlan(cancelled, null).action, "reverted");
  assert.equal(getTrainingExceptionPlan(cancelled, { ...cancelled }), null);
});

test("exception normalization retains existing override fields without adding types", () => {
  const result = normalizeTrainingExceptionPayload({ team_training_time_id: "time-1", override_start_time: "18:00" });
  assert.equal(result.exception_type, "cancelled");
  assert.equal(result.override_start_time, "18:00");
});
