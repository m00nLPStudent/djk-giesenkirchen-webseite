import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("public POST returns only minimal options through a server-only service", async () => {
  const route = await read("../../app/api/membership/team-options/route.js");
  assert.match(route, /export async function POST/);
  assert.match(route, /Cache-Control.*no-store/);
  assert.match(route, /resolveMembershipFootballTeams/);
  assert.doesNotMatch(route, /team_season_year_groups|\.from\(|\.rpc\(/);
  assert.doesNotMatch(route, /console\.|birthYear|department_id|created_at/);
  const core = await read("./membershipTeamResolver.core.mjs");
  assert.match(core, /teamSeasonId:[\s\S]*name:[\s\S]*ageGroup:/);
  assert.doesNotMatch(core, /return \[\{[^}]*teamId:/);
});

test("resolver repository is read-only and filters current active football relations", async () => {
  const repository = await read("./membershipTeamResolver.repository.js");
  assert.match(repository, /import "server-only"/);
  assert.match(repository, /team_season_year_groups/);
  assert.match(repository, /\.eq\("is_current", true\)/);
  assert.match(repository, /\.eq\("is_active", true\)/);
  assert.match(repository, /\.eq\("department_id", department\.data\.id\)/);
  assert.doesNotMatch(repository, /\.insert\(|\.update\(|\.upsert\(|\.delete\(|\.rpc\(/);
});

test("no client source reads mappings or contains service-role configuration", async () => {
  const form = await read("../../components/website/membership/MembershipRequestForm.js");
  const football = await read("../../components/website/membership/components/MembershipFootballData.js");
  for (const source of [form, football]) {
    assert.doesNotMatch(source, /team_season_year_groups|SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_.*SERVICE/i);
  }
});

test("B0 grants and RLS remain hardened and B2 adds no SQL", async () => {
  const proposal = await read("../../../docs/sql/b15-21b0-team-season-year-groups-proposal.sql");
  assert.match(proposal, /ENABLE ROW LEVEL SECURITY/i);
  assert.match(proposal, /REVOKE ALL PRIVILEGES.*PUBLIC, anon, authenticated/is);
  assert.match(proposal, /REVOKE ALL ON FUNCTION.*PUBLIC, anon, authenticated/is);
});

test("resolver sources neither persist nor log birth data", async () => {
  const sources = await Promise.all([read("./membershipTeamResolver.core.mjs"), read("./membershipTeamResolver.repository.js"), read("./membershipTeamResolver.service.js"), read("../../app/api/membership/team-options/route.js")]);
  for (const source of sources) {
    assert.doesNotMatch(source, /\.insert\(|\.update\(|\.upsert\(|\.delete\(/);
    assert.doesNotMatch(source, /console\./);
  }
});
