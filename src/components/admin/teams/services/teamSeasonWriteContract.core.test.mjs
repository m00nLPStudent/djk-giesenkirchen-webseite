import test from "node:test";
import assert from "node:assert/strict";
import { resolveTeamSeasonWriteContract } from "./teamSeasonWriteContract.core.mjs";

test("existing team seasons always use update and need no create permission", () => {
  assert.deepEqual(
    resolveTeamSeasonWriteContract({
      existingTeamSeasonId: "season-link-1",
      canCreateTeamSeason: false,
    }),
    {
      ok: true,
      operation: "update",
      teamSeasonId: "season-link-1",
    },
  );
});

test("missing team seasons fail closed without teams.create", () => {
  const contract = resolveTeamSeasonWriteContract({
    existingTeamSeasonId: null,
    canCreateTeamSeason: false,
  });
  assert.equal(contract.ok, false);
  assert.equal(contract.operation, null);
  assert.match(contract.error, /teams\.create/);
});

test("missing team seasons use insert for create-authorized roles", () => {
  assert.deepEqual(
    resolveTeamSeasonWriteContract({
      existingTeamSeasonId: null,
      canCreateTeamSeason: true,
    }),
    { ok: true, operation: "insert", teamSeasonId: null },
  );
});
