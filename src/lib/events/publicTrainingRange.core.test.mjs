import test from "node:test";
import assert from "node:assert/strict";
import { resolvePublicTrainingRange } from "./publicTrainingRange.core.mjs";

const sunday = new Date(2026, 8, 13, 12, 0, 0);

test("Today and Tomorrow includes Monday after a Sunday review", () => {
  const result = resolvePublicTrainingRange({}, sunday);
  assert.equal(result.range, "short");
  assert.equal(result.from.getFullYear(), 2026);
  assert.equal(result.from.getMonth(), 8);
  assert.equal(result.from.getDate(), 13);
  assert.equal(result.to.getDate(), 14);
  assert.equal(result.to.getHours(), 23);
  assert.ok(new Date(2026, 8, 14, 17, 0, 0) <= result.to);
});

test("week contract keeps the existing rolling seven-day Sunday-to-Saturday range", () => {
  const result = resolvePublicTrainingRange({ range: "week" }, sunday);
  assert.equal(result.range, "week");
  assert.equal(result.from.getDate(), 13);
  assert.equal(result.to.getDate(), 19);
  assert.ok(new Date(2026, 8, 14, 17, 0, 0) <= result.to);
});
