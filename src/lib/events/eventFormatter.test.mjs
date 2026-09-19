import test from "node:test";
import assert from "node:assert/strict";
import {
  formatEventDate,
  formatEventDateWithWeekday,
} from "./eventFormatter.js";

test("keeps the existing compact German date format", () => {
  assert.equal(formatEventDate("2026-09-18T12:00:00Z"), "18.09.2026");
});

test("adds the matching German weekday to training dates", () => {
  assert.equal(
    formatEventDateWithWeekday("2026-09-18T12:00:00Z"),
    "Freitag, 18.09.2026",
  );
});

test("keeps the established empty-date fallback", () => {
  assert.equal(formatEventDateWithWeekday(null), "Kein Datum");
});
