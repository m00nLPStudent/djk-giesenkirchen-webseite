import test from "node:test";
import assert from "node:assert/strict";
import { MEMBERSHIP_PRIVACY_POLICY_VERSION, prepareMembershipRequest } from "./membershipSubmit.core.mjs";

const now = new Date("2026-08-26T12:00:00.000Z");
const teamId = "11111111-1111-4111-8111-111111111111";
const teamSeasonId = "22222222-2222-4222-8222-222222222222";
const valid = {
  first_name: " Max ", last_name: " Muster ", phone: " +49 2166 12345 ",
  email: " MAX@EXAMPLE.TEST ", birthdate: "2019-02-02",
  request_type: "aktives-mitglied-fussball", desired_team_season_id: teamSeasonId,
  message: " Hallo ", privacy_accepted: true,
};
async function prepare(overrides = {}, selection = { teamSeasonId, teamId }) {
  return prepareMembershipRequest({ ...valid, ...overrides }, {
    now,
    resolveTeamSeasonSelection: async () => ({ data: selection, error: null }),
  });
}

test("valid submit is normalized and carries server-owned consent evidence", async () => {
  const result = await prepare();
  assert.equal(result.error, null);
  assert.deepEqual(result.data, {
    first_name: "Max", last_name: "Muster", phone: "+49 2166 12345",
    email: "max@example.test", birthdate: "2019-02-02",
    request_type: "aktives-mitglied-fussball", year_group: "2019",
    desired_team_id: teamId, desired_team_season_id: teamSeasonId, message: "Hallo", privacy_consent: true,
    privacy_consent_at: now.toISOString(), privacy_policy_version: MEMBERSHIP_PRIVACY_POLICY_VERSION,
  });
});

for (const [name, overrides, field] of [
  ["missing first name", { first_name: " " }, "first_name"],
  ["missing last name", { last_name: "" }, "last_name"],
  ["missing phone", { phone: null }, "phone"],
  ["invalid email", { email: "not-an-email" }, "email"],
  ["missing birthdate", { birthdate: "" }, "birthdate"],
  ["future birthdate", { birthdate: "2027-01-01" }, "birthdate"],
  ["invalid request type", { request_type: "admin-made-up" }, "request_type"],
  ["missing privacy consent", { privacy_accepted: false }, "privacy_accepted"],
  ["invalid team season UUID", { desired_team_season_id: "not-a-uuid" }, "desired_team_season_id"],
  ["overlong message", { message: "x".repeat(2001) }, "message"],
  ["filled honeypot", { website: "https://spam.test" }, "website"],
]) {
  test(name, async () => {
    const result = await prepare(overrides);
    assert.equal(result.error?.field, field);
  });
}

test("manipulated browser year_group is ignored", async () => {
  const result = await prepare({ year_group: "2016" });
  assert.equal(result.data.year_group, "2019");
});

test("manipulated or ineligible team-season selection is rejected", async () => {
  const result = await prepare({}, null);
  assert.equal(result.error.field, "desired_team_season_id");
});

for (const requestType of ["passives-mitglied", "trainer-werden", "aktives-mitglied-tischtennis", "aktives-mitglied-gymnastik-damen", "aktives-mitglied-behindertensport"]) {
  test(`team is cleared for ${requestType}`, async () => {
    let teamLookupCalled = false;
    const result = await prepareMembershipRequest({ ...valid, request_type: requestType }, {
      now,
      resolveTeamSeasonSelection: async () => { teamLookupCalled = true; return { data: { teamSeasonId, teamId }, error: null }; },
    });
    assert.equal(result.data.desired_team_id, null);
    assert.equal(result.data.desired_team_season_id, null);
    assert.equal(teamLookupCalled, false);
  });
}

test("workflow and admin fields are not copied from the browser payload", async () => {
  const result = await prepare({ status: "done", internal_note: "forged", forwarded_at: now.toISOString(), created_at: now.toISOString() });
  for (const field of ["status", "internal_note", "forwarded_at", "created_at"]) assert.equal(field in result.data, false);
});

test("football without a team-season remains valid for manual assignment", async () => {
  const result = await prepare({ desired_team_season_id: null, desired_team_id: teamId });
  assert.equal(result.error, null);
  assert.equal(result.data.desired_team_id, null);
  assert.equal(result.data.desired_team_season_id, null);
});
