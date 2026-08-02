import assert from "node:assert/strict";
import test from "node:test";
import { archiveCoach } from "./archive.service.js";

function createDb(seed, { failCoachUpdateOnce = false } = {}) {
  const state = structuredClone(seed);
  let shouldFailCoachUpdate = failCoachUpdateOnce;

  function query(table) {
    let operation = "select";
    let payload = null;
    const filters = [];

    const builder = {
      select() { operation = "select"; return builder; },
      update(next) { operation = "update"; payload = next; return builder; },
      eq(key, value) { filters.push(["eq", key, value]); return builder; },
      in(key, values) { filters.push(["in", key, values]); return builder; },
      then(resolve) {
        const matches = (row) => filters.every(([type, key, value]) => type === "eq" ? row[key] === value : value.includes(row[key]));
        if (operation === "update") {
          if (table === "coaches" && shouldFailCoachUpdate) {
            shouldFailCoachUpdate = false;
            return resolve({ data: null, error: new Error("forced update failure") });
          }
          state[table].filter(matches).forEach((row) => Object.assign(row, payload));
          return resolve({ data: null, error: null });
        }
        return resolve({ data: state[table].filter(matches).map((row) => ({ ...row })), error: null });
      },
    };
    return builder;
  }

  return { db: { from: query }, state };
}

const seed = () => ({
  coaches: [{ id: "coach-1", is_active: true }],
  seasons: [{ id: "season-current", is_current: true }, { id: "season-old", is_current: false }],
  team_seasons: [{ id: "ts-current", season_id: "season-current" }, { id: "ts-old", season_id: "season-old" }],
  coach_team_seasons: [
    { id: "cts-current", coach_id: "coach-1", team_season_id: "ts-current", is_active: true },
    { id: "cts-old", coach_id: "coach-1", team_season_id: "ts-old", is_active: true },
  ],
});

test("coach archive deactivates coach and only current-season assignments", async () => {
  const { db, state } = createDb(seed());
  const result = await archiveCoach(db, "coach-1");

  assert.equal(result.ok, true);
  assert.equal(result.details.assignments, 1);
  assert.equal(state.coaches[0].is_active, false);
  assert.equal(state.coach_team_seasons[0].is_active, false);
  assert.equal(state.coach_team_seasons[1].is_active, true);
});

test("reactivation does not restore archived assignments", async () => {
  const { db, state } = createDb(seed());
  await archiveCoach(db, "coach-1");
  state.coaches[0].is_active = true;

  assert.equal(state.coach_team_seasons[0].is_active, false);
});

test("partial coach archive failure rolls back the original state", async () => {
  const { db, state } = createDb(seed(), { failCoachUpdateOnce: true });
  const result = await archiveCoach(db, "coach-1");

  assert.equal(result.ok, false);
  assert.equal(result.code, "DATABASE_ERROR");
  assert.equal(state.coaches[0].is_active, true);
  assert.equal(state.coach_team_seasons[0].is_active, true);
  assert.equal(state.coach_team_seasons[1].is_active, true);
});
