import test from "node:test";
import assert from "node:assert/strict";
import {
  executeSafeTeamDeleteOrArchiveCore,
  loadTeamDependencySummary,
} from "./teamDelete.core.mjs";

class MockQuery {
  constructor(table, handler) {
    this.table = table;
    this.handler = handler;
    this.operation = "select";
    this.columns = "*";
    this.selectOptions = {};
    this.filters = [];
    this.payload = null;
  }

  select(columns, options = {}) {
    this.columns = columns;
    this.selectOptions = options;
    return this;
  }

  update(payload) {
    this.operation = "update";
    this.payload = payload;
    return this;
  }

  delete() {
    this.operation = "delete";
    return this;
  }

  async eq(key, value) {
    this.filters.push({ type: "eq", key, value });
    return await this.handler(this.snapshot());
  }

  async in(key, values) {
    this.filters.push({ type: "in", key, value: values });
    return await this.handler(this.snapshot());
  }

  snapshot() {
    return {
      table: this.table,
      operation: this.operation,
      columns: this.columns,
      selectOptions: this.selectOptions,
      filters: [...this.filters],
      payload: this.payload,
    };
  }
}

function createMockDb(handler) {
  return {
    from(table) {
      return new MockQuery(table, handler);
    },
  };
}

function getFilter(query, key) {
  return query.filters.find((filter) => filter.key === key)?.value;
}

test("loadTeamDependencySummary counts coach dependencies via coach_team_seasons instead of coaches.team_id", async () => {
  const db = createMockDb(async (query) => {
    if (query.table === "coaches") {
      assert.fail("coaches.team_id must not be queried by the delete guard");
    }

    if (query.table === "players") {
      assert.fail("players.team_id must not be queried by the delete guard");
    }

    if (query.table === "team_seasons" && query.columns === "id") {
      return { data: [{ id: "ts-1" }, { id: "ts-2" }], error: null };
    }

    if (query.selectOptions?.count === "exact") {
      if (query.table === "news") return { count: 0, error: null };
      if (query.table === "team_seasons") return { count: 2, error: null };
      if (query.table === "events") return { count: 0, error: null };
      if (query.table === "membership_requests") return { count: 0, error: null };
      if (query.table === "player_team_seasons") return { count: 0, error: null };
      if (query.table === "coach_team_seasons") return { count: 3, error: null };
      if (query.table === "team_training_times") return { count: 0, error: null };
      if (query.table === "club_closure_periods") return { count: 0, error: null };
      if (query.table === "team_training_exceptions") return { count: 0, error: null };
    }

    if (query.table === "team_training_times" && query.columns === "id") {
      return { data: [], error: null };
    }

    if (query.table === "player_team_seasons" && query.columns === "player_id") {
      assert.deepEqual(getFilter(query, "team_season_id"), ["ts-1", "ts-2"]);
      return {
        data: [{ player_id: "player-1" }, { player_id: "player-1" }],
        error: null,
      };
    }

    assert.fail(`Unhandled query: ${JSON.stringify(query)}`);
  });

  const result = await loadTeamDependencySummary(db, "team-1");

  assert.equal(result.error, null);
  assert.equal(result.hasDependencies, true);
  assert.equal(result.summary.players, 1);
  assert.equal(result.summary.coaches, 3);
  assert.equal(result.summary.coachTeamSeasons, 3);
});

test("executeSafeTeamDeleteOrArchive archives a team when historical coach assignments still exist", async () => {
  const updates = [];
  const result = await executeSafeTeamDeleteOrArchiveCore(
    {},
    { id: "team-1" },
    {
      async archiveTeam(_, teamId) {
        updates.push(teamId);
        return { error: null };
      },
      async hardDeleteTeam() {
        assert.fail("hard delete must not run while coach dependencies exist");
      },
      async loadDependencies() {
        return {
          error: null,
          hasDependencies: true,
          summary: { coaches: 1, coachTeamSeasons: 1 },
        };
      },
    },
  );

  assert.equal(result.error, null);
  assert.equal(result.outcome, "archived");
  assert.deepEqual(updates, ["team-1"]);
});

test("executeSafeTeamDeleteOrArchive deletes a dependency-free team", async () => {
  const deletions = [];
  const result = await executeSafeTeamDeleteOrArchiveCore(
    {},
    { id: "team-2" },
    {
      async archiveTeam() {
        assert.fail("archive must not run for dependency-free teams");
      },
      async hardDeleteTeam(_, team) {
        deletions.push(team.id);
        return { error: null };
      },
      async loadDependencies() {
        return {
          error: null,
          hasDependencies: false,
          summary: { coaches: 0, coachTeamSeasons: 0 },
        };
      },
    },
  );

  assert.equal(result.error, null);
  assert.equal(result.outcome, "deleted");
  assert.deepEqual(deletions, ["team-2"]);
});
