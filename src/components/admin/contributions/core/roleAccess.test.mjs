import test from "node:test";
import assert from "node:assert/strict";

import { roleHasContributionPermission } from "./roleAccess.js";

test("kassierer is allowed for contribution mutations", () => {
  assert.equal(
    roleHasContributionPermission("kassierer", "contributions.record_payment"),
    true,
  );
});

test("vorstand is allowed to view and export", () => {
  assert.equal(
    roleHasContributionPermission("vorstand", "contributions.view"),
    true,
  );
  assert.equal(
    roleHasContributionPermission("vorstand", "contributions.export"),
    true,
  );
});

test("vorstand is not allowed to mutate", () => {
  assert.equal(
    roleHasContributionPermission("vorstand", "contributions.edit"),
    false,
  );
});

test("trainer is not allowed to access contribution permissions", () => {
  assert.equal(
    roleHasContributionPermission("trainer", "contributions.view"),
    false,
  );
});

test("jugendleiter is not allowed to access contribution permissions", () => {
  assert.equal(
    roleHasContributionPermission("jugendleiter", "contributions.view"),
    false,
  );
});
