import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveTrainingOwnerLink,
  selectTeamTrainingForDepartment,
} from "./publicTrainingScope.core.mjs";

const teamEvent = (overrides = {}) => ({
  source_type: "team_training",
  team_id: "team-1",
  team_slug: "erste-herren",
  department_slug: "fussball",
  ...overrides,
});

test("football training scope excludes table tennis, department and missing ownership", () => {
  const football = teamEvent();
  assert.deepEqual(
    selectTeamTrainingForDepartment([
      football,
      teamEvent({ team_id: "tt-1", team_slug: "erste", department_slug: "tischtennis" }),
      { source_type: "department_training", department_slug: "behindertensport" },
      teamEvent({ team_id: null }),
      teamEvent({ department_slug: null }),
    ], "fussball"),
    [football],
  );
});

test("department scope uses relational ownership and does not discard legacy team slugs", () => {
  const tableTennis = teamEvent({
    team_id: "tt-1",
    team_slug: "1 herren",
    department_slug: "tischtennis",
  });

  assert.deepEqual(
    selectTeamTrainingForDepartment([tableTennis], "tischtennis"),
    [tableTennis],
  );
});

test("owner links use explicit source and department ownership", () => {
  assert.deepEqual(resolveTrainingOwnerLink(teamEvent()), {
    href: "/fussball/erste-herren",
    label: "Zur Mannschaft",
    kind: "team",
  });
  assert.deepEqual(resolveTrainingOwnerLink(teamEvent({ department_slug: "tischtennis" })), {
    href: "/tischtennis/mannschaften/erste-herren",
    label: "Zur Mannschaft",
    kind: "team",
  });
  assert.deepEqual(resolveTrainingOwnerLink(teamEvent({ team_slug: "1 herren", department_slug: "tischtennis" })), {
    href: "/tischtennis/mannschaften/1%20herren",
    label: "Zur Mannschaft",
    kind: "team",
  });
  assert.deepEqual(resolveTrainingOwnerLink({ source_type: "department_training", department_slug: "behindertensport" }), {
    href: "/behindertensport",
    label: "Zum Bereich",
    kind: "department",
  });
});

test("owner links fail closed for unassigned, unknown and unsafe records", () => {
  assert.equal(resolveTrainingOwnerLink(teamEvent({ department_slug: null })), null);
  assert.equal(resolveTrainingOwnerLink(teamEvent({ department_slug: "unknown" })), null);
  assert.equal(resolveTrainingOwnerLink(teamEvent({ team_slug: "//evil.example" })), null);
  assert.equal(resolveTrainingOwnerLink({ source_type: "department_training", department_slug: "unknown" }), null);
});
