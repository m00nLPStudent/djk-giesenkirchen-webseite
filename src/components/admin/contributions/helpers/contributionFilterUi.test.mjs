import test from "node:test";
import assert from "node:assert/strict";

import {
  CONTRIBUTION_FILTERS_DEFAULT_EXPANDED,
  countActiveContributionFilters,
  getContributionFilterBadgeLabel,
} from "./contributionFilterUi.js";

test("filters default to collapsed on first render", () => {
  assert.equal(CONTRIBUTION_FILTERS_DEFAULT_EXPANDED, false);
});

test("active filter badge only counts meaningful overrides", () => {
  const filters = {
    seasonId: "season-2",
    playerId: "player-1",
    status: "open",
    sort: "default",
    pageSize: 25,
  };
  const filterOptions = {
    seasons: [
      { value: "season-1", isCurrent: true },
      { value: "season-2", isCurrent: false },
    ],
  };

  assert.equal(countActiveContributionFilters(filters, filterOptions), 3);
  assert.equal(
    getContributionFilterBadgeLabel(filters, filterOptions),
    "3 Filter aktiv",
  );
});

test("filters without overrides do not show a badge", () => {
  const filters = {
    seasonId: "season-1",
    sort: "default",
    pageSize: 25,
    overdue: false,
  };
  const filterOptions = {
    seasons: [{ value: "season-1", isCurrent: true }],
  };

  assert.equal(countActiveContributionFilters(filters, filterOptions), 0);
  assert.equal(getContributionFilterBadgeLabel(filters, filterOptions), "");
});

