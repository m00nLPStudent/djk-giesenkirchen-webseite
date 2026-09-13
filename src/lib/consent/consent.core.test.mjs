import assert from "node:assert/strict";
import test from "node:test";
import { CONSENT_VERSION, DEFAULT_CONSENT, createConsent, parseStoredConsent } from "./consent.core.mjs";

test("consent defaults keep optional external media disabled", () => {
  assert.deepEqual(DEFAULT_CONSENT, { version: CONSENT_VERSION, necessary: true, externalMedia: false, updatedAt: null });
});

test("current valid consent is normalized", () => {
  const updatedAt = "2026-09-13T10:00:00.000Z";
  assert.deepEqual(parseStoredConsent(JSON.stringify({ version: CONSENT_VERSION, necessary: true, externalMedia: true, updatedAt, ignored: "discarded" })), { version: CONSENT_VERSION, necessary: true, externalMedia: true, updatedAt });
});

test("missing, stale, malformed and unsafe consent fail closed", () => {
  for (const value of [null, "{}", "broken", JSON.stringify({ version: "old", necessary: true, externalMedia: true, updatedAt: new Date().toISOString() }), JSON.stringify({ version: CONSENT_VERSION, necessary: false, externalMedia: true, updatedAt: new Date().toISOString() }), JSON.stringify({ version: CONSENT_VERSION, necessary: true, externalMedia: "true", updatedAt: new Date().toISOString() })]) assert.equal(parseStoredConsent(value), null);
});

test("created decisions always keep necessary enabled", () => {
  const now = new Date("2026-09-13T10:00:00.000Z");
  assert.deepEqual(createConsent(false, now), { version: CONSENT_VERSION, necessary: true, externalMedia: false, updatedAt: now.toISOString() });
  assert.equal(createConsent(true, now).externalMedia, true);
});
