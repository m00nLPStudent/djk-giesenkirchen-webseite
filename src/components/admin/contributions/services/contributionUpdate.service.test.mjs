import test from "node:test";
import assert from "node:assert/strict";

import { updateContribution } from "./contributionUpdate.service.js";

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
    async loadContributionRecordById() {
      return {
        data: {
          id: "c-1",
          status: "open",
          amount_due: "50.00",
          amount_paid: "10.00",
          amount_waived: "0.00",
          deferred_until: null,
          canceled_at: null,
        },
        error: null,
      };
    },
    async updateContributionRecord() {
      return { data: { id: "c-1" }, error: null };
    },
    async loadContributionById() {
      return { id: "c-1", contributionId: "c-1" };
    },
    ...overrides,
  };
}

test("updateContribution rejects amount_due below paid plus waived", async () => {
  const result = await updateContribution(
    {
      contributionId: "c-1",
      playerId: "player-1",
      seasonId: "season-1",
      contributionKey: "regular",
      title: "Neu",
      amountDue: "5",
      dueDate: "2026-09-01",
    },
    context,
    createDeps(),
  );

  assert.equal(result.ok, false);
  assert.equal(result.code, "VALIDATION_ERROR");
});

test("updateContribution rejects canceled contributions", async () => {
  const result = await updateContribution(
    {
      contributionId: "c-1",
      playerId: "player-1",
      seasonId: "season-1",
      contributionKey: "regular",
      title: "Neu",
      amountDue: "15",
      dueDate: "2026-09-01",
    },
    context,
    createDeps({
      async loadContributionRecordById() {
        return {
          data: {
            id: "c-1",
            status: "canceled",
            amount_due: "50.00",
            amount_paid: "0.00",
            amount_waived: "0.00",
            deferred_until: null,
            canceled_at: "2026-08-01T00:00:00Z",
          },
          error: null,
        };
      },
    }),
  );

  assert.equal(result.ok, false);
  assert.equal(result.code, "CONTRIBUTION_CANCELED");
});

test("updateContribution accepts a valid update", async () => {
  const result = await updateContribution(
    {
      contributionId: "c-1",
      playerId: "player-1",
      seasonId: "season-1",
      contributionKey: "regular",
      title: "Neu",
      amountDue: "60",
      dueDate: "2026-09-01",
    },
    context,
    createDeps(),
  );

  assert.equal(result.ok, true);
  assert.equal(result.data.id, "c-1");
});

test("updateContribution rejects duplicate regular contributions after season change", async () => {
  const result = await updateContribution(
    {
      contributionId: "c-1",
      playerId: "player-1",
      seasonId: "season-2",
      contributionKey: "regular",
      title: "Neu",
      amountDue: "60",
      dueDate: "2026-09-01",
    },
    context,
    createDeps({
      async loadSeasonRecordById() {
        return { data: { id: "season-2" }, error: null };
      },
      async findDuplicateContribution() {
        return { data: { id: "existing" }, error: null };
      },
    }),
  );

  assert.equal(result.ok, false);
  assert.equal(result.code, "DUPLICATE_CONTRIBUTION");
});
