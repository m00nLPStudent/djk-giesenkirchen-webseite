import test from "node:test";
import assert from "node:assert/strict";

import { addCents, parseEuroCents } from "./money.js";

test("parseEuroCents accepts a valid integer amount", () => {
  const result = parseEuroCents("25", { allowZero: false });
  assert.equal(result.ok, true);
  assert.equal(result.cents, 2500);
  assert.equal(result.decimal, "25.00");
});

test("parseEuroCents accepts a comma amount", () => {
  const result = parseEuroCents("12,34", { allowZero: false });
  assert.equal(result.ok, true);
  assert.equal(result.cents, 1234);
});

test("parseEuroCents accepts a dot amount", () => {
  const result = parseEuroCents("12.34", { allowZero: false });
  assert.equal(result.ok, true);
  assert.equal(result.cents, 1234);
});

test("parseEuroCents rejects negative amounts", () => {
  const result = parseEuroCents("-1", { allowZero: false });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "negative");
});

test("parseEuroCents rejects more than two decimals", () => {
  const result = parseEuroCents("1.999", { allowZero: false });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "format");
});

test("parseEuroCents rejects empty values", () => {
  const result = parseEuroCents("", { allowZero: false });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "required");
});

test("parseEuroCents rejects invalid text", () => {
  const result = parseEuroCents("abc", { allowZero: false });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "format");
});

test("addCents stays cent-exact", () => {
  assert.equal(addCents([10, 20, 30]), 60);
  assert.equal(addCents([333, 333, 334]), 1000);
});
