import test from "node:test";
import assert from "node:assert/strict";

import {
  canOpenContributionDetail,
  canViewScopedContributionStatus,
  getContributionStatusVisibility,
} from "./contributionStatusScope.js";

test("trainer can see scoped contribution statuses without global detail access", () => {
  const scopeContext = {
    roleKeys: ["trainer"],
    permissionKeys: ["players.view", "teams.view"],
  };

  assert.equal(canViewScopedContributionStatus(scopeContext), true);
  assert.equal(canOpenContributionDetail(scopeContext), false);
  assert.equal(getContributionStatusVisibility(scopeContext), "scoped");
});

test("vorstand with contribution view keeps detail access", () => {
  const scopeContext = {
    roleKeys: ["vorstand"],
    permissionKeys: ["players.view", "teams.view", "contributions.view"],
  };

  assert.equal(canViewScopedContributionStatus(scopeContext), true);
  assert.equal(canOpenContributionDetail(scopeContext), true);
  assert.equal(getContributionStatusVisibility(scopeContext), "full");
});

test("betreuer without explicit contribution permission sees no contribution status", () => {
  const scopeContext = {
    roleKeys: ["betreuer"],
    permissionKeys: ["players.view", "teams.view"],
  };

  assert.equal(canViewScopedContributionStatus(scopeContext), false);
  assert.equal(getContributionStatusVisibility(scopeContext), "none");
});
