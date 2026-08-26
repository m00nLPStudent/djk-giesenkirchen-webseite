import assert from "node:assert/strict";
import test from "node:test";
import { requiresPublishPermission } from "./publishPermission.core.mjs";
import { formatDateTimeLocalInput } from "../dates.js";

for (const area of ["news", "events"]) {
  test(`${area}: create draft needs no publish permission`, () => {
    assert.equal(requiresPublishPermission(null, { is_published: false }), false);
  });

  test(`${area}: create published needs publish permission`, () => {
    assert.equal(requiresPublishPermission(null, { is_published: true }), true);
  });

  test(`${area}: unchanged edit needs no publish permission`, () => {
    assert.equal(requiresPublishPermission({ is_published: true }, { is_published: true }), false);
  });

  test(`${area}: publish and unpublish both need publish permission`, () => {
    assert.equal(requiresPublishPermission({ is_published: false }, { is_published: true }), true);
    assert.equal(requiresPublishPermission({ is_published: true }, { is_published: false }), true);
  });
}

test("club history applies the same publish and unpublish contract", () => {
  assert.equal(requiresPublishPermission({ is_published: false }, { is_published: false }, { tracksPublishedAt: true }), false);
  assert.equal(requiresPublishPermission({ is_published: false }, { is_published: true }, { tracksPublishedAt: true }), true);
  assert.equal(requiresPublishPermission({ is_published: true }, { is_published: false }, { tracksPublishedAt: true }), true);
});

test("published_at changes require permission only while publicly enabled", () => {
  const previous = { is_published: true, published_at: "2026-08-26T10:00:00.000Z" };
  assert.equal(requiresPublishPermission(previous, { is_published: true, published_at: "2026-08-26T10:00:00Z" }, { tracksPublishedAt: true }), false);
  assert.equal(requiresPublishPermission(previous, { is_published: true, published_at: "2026-08-27T10:00:00Z" }, { tracksPublishedAt: true }), true);
  assert.equal(requiresPublishPermission({ ...previous, is_published: false }, { is_published: false, published_at: null }, { tracksPublishedAt: true }), false);
});

test("Europe/Berlin datetime-local round trip preserves the UTC instant", () => {
  const previousTimeZone = process.env.TZ;
  process.env.TZ = "Europe/Berlin";
  const localValue = formatDateTimeLocalInput("2026-08-26T11:10:00.000Z");
  assert.equal(localValue, "2026-08-26T13:10");
  const roundTrip = new Date(localValue).toISOString();
  if (previousTimeZone === undefined) delete process.env.TZ;
  else process.env.TZ = previousTimeZone;

  const previous = { is_published: true, published_at: "2026-08-26T11:10:00.000Z" };
  const berlinLocalRoundTrip = { is_published: true, published_at: roundTrip };
  assert.equal(requiresPublishPermission(previous, berlinLocalRoundTrip, { tracksPublishedAt: true }), false);
});
