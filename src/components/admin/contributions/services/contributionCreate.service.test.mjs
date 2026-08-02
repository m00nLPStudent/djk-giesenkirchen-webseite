import test from "node:test";
import assert from "node:assert/strict";

import { createContribution } from "./contributionCreate.service.js";

const context = { db: {}, actorProfileId: "admin-1" };

function createDeps(overrides = {}) {
  return {
    async loadPlayerRecordById() {
      return { data: { id: "player-1" }, error: null };
    },
    async loadSeasonRecordById() {
      return { data: { id: "season-1" }, error: null };
    },
    async findDuplicateContribution() {
      return { data: null, error: null };
    },
    async insertContribution() {
      return { data: { id: "contribution-1" }, error: null };
    },
    async loadContributionById() {
      return { id: "contribution-1", contributionId: "contribution-1" };
    },
    ...overrides,
  };
}

test("createContribution accepts a valid contribution", async () => {
  const result = await createContribution(
    {
      playerId: "player-1",
      seasonId: "season-1",
      contributionKey: "regular",
      title: "Jahresbeitrag",
      amountDue: "75,50",
      dueDate: "2026-09-01",
    },
    context,
    createDeps(),
  );

  assert.equal(result.ok, true);
  assert.equal(result.data.id, "contribution-1");
});

test("createContribution rejects an invalid key", async () => {
  const result = await createContribution(
    {
      playerId: "player-1",
      seasonId: "season-1",
      contributionKey: "invalid",
      title: "Test",
      amountDue: "10",
      dueDate: "2026-09-01",
    },
    context,
    createDeps(),
  );

  assert.equal(result.ok, false);
  assert.equal(result.code, "VALIDATION_ERROR");
  assert.ok(result.fieldErrors.contributionKey);
});

test("createContribution rejects a duplicate regular contribution", async () => {
  const result = await createContribution(
    {
      playerId: "player-1",
      seasonId: "season-1",
      contributionKey: "regular",
      title: "Test",
      amountDue: "10",
      dueDate: "2026-09-01",
    },
    context,
    createDeps({
      async findDuplicateContribution() {
        return { data: { id: "existing" }, error: null };
      },
    }),
  );

  assert.equal(result.ok, false);
  assert.equal(result.code, "DUPLICATE_CONTRIBUTION");
});

test("createContribution rejects a missing player", async () => {
  const result = await createContribution(
    {
      playerId: "player-1",
      seasonId: "season-1",
      contributionKey: "regular",
      title: "Test",
      amountDue: "10",
      dueDate: "2026-09-01",
    },
    context,
    createDeps({
      async loadPlayerRecordById() {
        return { data: null, error: null };
      },
    }),
  );

  assert.equal(result.ok, false);
  assert.equal(result.code, "NOT_FOUND");
});

test("createContribution rejects a missing season", async () => {
  const result = await createContribution(
    {
      playerId: "player-1",
      seasonId: "season-1",
      contributionKey: "regular",
      title: "Test",
      amountDue: "10",
      dueDate: "2026-09-01",
    },
    context,
    createDeps({
      async loadSeasonRecordById() {
        return { data: null, error: null };
      },
    }),
  );

  assert.equal(result.ok, false);
  assert.equal(result.code, "NOT_FOUND");
});

test("createContribution rejects a negative amount", async () => {
  const result = await createContribution(
    {
      playerId: "player-1",
      seasonId: "season-1",
      contributionKey: "regular",
      title: "Test",
      amountDue: "-5",
      dueDate: "2026-09-01",
    },
    context,
    createDeps(),
  );

  assert.equal(result.ok, false);
  assert.equal(result.code, "VALIDATION_ERROR");
  assert.ok(result.fieldErrors.amountDue);
});
