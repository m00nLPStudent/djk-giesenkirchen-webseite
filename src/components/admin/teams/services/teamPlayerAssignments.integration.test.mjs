import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const serviceSource = readFileSync(
  new URL("./teams.service.js", import.meta.url),
  "utf8",
);

test("team roster synchronization reads existing assignments before applying a differential plan", () => {
  assert.match(
    serviceSource,
    /\.select\("id, player_id, sort_order, is_active"\)/,
  );
  assert.match(serviceSource, /createPlayerAssignmentSyncPlan\(/);
  assert.doesNotMatch(
    serviceSource,
    /from\("player_team_seasons"\)\s*\.delete\(\)\s*\.eq\("team_season_id", teamSeasonId\);/,
  );
});

test("retained roster rows update ordering only and never overwrite player metadata", () => {
  const updateBlock = serviceSource.match(
    /for \(const assignment of syncPlan\.retainedAssignments\)[\s\S]*?if \(updateResult\.error\)/,
  )?.[0];

  assert.ok(updateBlock);
  assert.match(updateBlock, /sort_order: assignment\.sort_order/);
  assert.match(updateBlock, /is_active: assignment\.is_active/);
  assert.doesNotMatch(updateBlock, /shirt_number|position_de|position_en|is_captain/);
});
