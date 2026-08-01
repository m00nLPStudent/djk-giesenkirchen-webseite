import test from "node:test";
import assert from "node:assert/strict";
import { resolveSeasonDisplayName } from "./seasonDisplay.js";

test("resolveSeasonDisplayName prefers seasonal display fields", () => {
  assert.equal(
    resolveSeasonDisplayName(
      {
        public_season_name: "2026/2027",
        seasonName: "2025/2026",
        season_name: "2024/2025",
      },
      "Keine Saison",
    ),
    "2026/2027",
  );
});

test("resolveSeasonDisplayName ignores legacy teams.season values", () => {
  assert.equal(
    resolveSeasonDisplayName(
      {
        season: "legacy-should-not-be-used",
      },
      "Keine Saison",
    ),
    "Keine Saison",
  );
});

test("resolveSeasonDisplayName supports alternate seasonal keys", () => {
  assert.equal(
    resolveSeasonDisplayName(
      {
        seasonName: "2027/2028",
      },
      "Keine Saison",
    ),
    "2027/2028",
  );
  assert.equal(
    resolveSeasonDisplayName(
      {
        season_name: "2028/2029",
      },
      "Keine Saison",
    ),
    "2028/2029",
  );
});
