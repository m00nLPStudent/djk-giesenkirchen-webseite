import assert from "node:assert/strict";
import test from "node:test";
import { canAccessMembershipRequests, loadMembershipRequestsWhenAllowed } from "./membershipAccess.js";

test("membership policy allows only approved technical contexts", () => {
  assert.equal(canAccessMembershipRequests({ roleKeys: ["superadmin"] }), true);
  assert.equal(canAccessMembershipRequests({ roleKeys: ["vorstand"], permissionKeys: ["membership_requests.view"] }), true);
  assert.equal(canAccessMembershipRequests({ roleKeys: ["vorstand"] }), false);
  assert.equal(canAccessMembershipRequests({ roleKeys: ["jugendleiter"], permissionKeys: ["membership_requests.view"] }), true);
  assert.equal(canAccessMembershipRequests({ roleKeys: ["jugendkoordinator"], permissionKeys: ["membership_requests.view"] }), true);
  for (const role of ["kassierer", "trainer", "betreuer", "gast", "unknown"]) {
    assert.equal(canAccessMembershipRequests({ roleKeys: [role], permissionKeys: ["membership_requests.view"] }), false);
  }
});

test("membership query gate skips denied loaders and runs allowed loaders", async () => {
  let calls = 0;
  const load = async () => { calls += 1; return ["safe-dto"]; };
  assert.deepEqual(await loadMembershipRequestsWhenAllowed({ context: { roleKeys: ["kassierer"], permissionKeys: ["membership_requests.view"] }, load }), { allowed: false, data: null });
  assert.equal(calls, 0);
  assert.deepEqual(await loadMembershipRequestsWhenAllowed({ context: { roleKeys: ["jugendleiter"], permissionKeys: ["membership_requests.view"] }, load }), { allowed: true, data: ["safe-dto"] });
  assert.equal(calls, 1);
});
