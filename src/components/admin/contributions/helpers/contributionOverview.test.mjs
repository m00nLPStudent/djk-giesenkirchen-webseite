import test from "node:test";
import assert from "node:assert/strict";

import {
  CONTRIBUTION_OVERVIEW_TABLE_BREAKPOINT,
  CONTRIBUTION_OVERVIEW_DESKTOP_COLUMNS,
  getContributionOverviewHref,
} from "./contributionOverview.js";

test("overview desktop columns stay compact and action-free", () => {
  assert.deepEqual(
    CONTRIBUTION_OVERVIEW_DESKTOP_COLUMNS.map((column) => column.label),
    [
      "Spieler",
      "Status",
      "Offen",
      "Uebersicht",
    ],
  );
  assert.equal(
    CONTRIBUTION_OVERVIEW_DESKTOP_COLUMNS.some(
      (column) => column.label === "Aktionen",
    ),
    false,
  );
});

test("overview mobile fields stay focused on orientation", () => {
  assert.equal(CONTRIBUTION_OVERVIEW_TABLE_BREAKPOINT, "lg");
});

test("overview rows link to the contribution detail page", () => {
  assert.equal(
    getContributionOverviewHref("contribution-123"),
    "/admin/contributions/contribution-123",
  );
});
