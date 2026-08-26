import test from "node:test";
import assert from "node:assert/strict";
import { canAccessMembershipRequestType, canReceiveMembershipPolicyNotification, getAllowedMembershipRequestTypes, getMembershipNotificationRoleKeys, resolveMembershipNotificationRecipients, resolveMembershipResponsibility } from "./membershipResponsibility.core.mjs";

const permissions = ["membership_requests.view", "membership_requests.edit", "membership_requests.forward"];
const can = (role, type, action = "view") => canAccessMembershipRequestType({ roleKeys: [role], permissionKeys: permissions, requestType: type, action });

test("responsibility matrix enforces all department boundaries", () => {
  const expected = {
    "aktives-mitglied-fussball": ["jugendleiter", "jugendkoordinator", "fussball-vorstand"],
    "aktives-mitglied-tischtennis": ["tischtennis-vorstand"],
    "aktives-mitglied-gymnastik-damen": ["damen-gymnastik-vorstand"],
    "aktives-mitglied-behindertensport": ["behindertensport-vorstand"],
    "trainer-werden": ["vorstand"],
    "passives-mitglied": ["vorstand"],
  };
  const roles = ["jugendleiter", "jugendkoordinator", "fussball-vorstand", "tischtennis-vorstand", "damen-gymnastik-vorstand", "behindertensport-vorstand"];
  for (const [requestType, allowedRoles] of Object.entries(expected)) {
    assert.equal(can("superadmin", requestType), true);
    for (const role of roles) assert.equal(can(role, requestType), allowedRoles.includes(role), `${role} / ${requestType}`);
    assert.equal(can("vorstand", requestType), true, `Gesamtvorstand / ${requestType}`);
  }
  assert.equal(can("fussball-vorstand", "aktives-mitglied-fussball", "edit"), true);
  assert.equal(can("behindertensport-vorstand", "aktives-mitglied-behindertensport", "forward"), true);
});

test("all active recipient candidates with a responsible role qualify without team-based routing", () => {
  const candidates = [
    { userId: "a", roleKeys: ["tischtennis-vorstand"], permissionKeys: permissions },
    { userId: "b", roleKeys: ["tischtennis-vorstand"], permissionKeys: permissions },
    { userId: "c", roleKeys: ["fussball-vorstand"], permissionKeys: permissions },
  ];
  assert.deepEqual(candidates.filter((item) => canReceiveMembershipPolicyNotification(item, "aktives-mitglied-tischtennis")).map((item) => item.userId), ["a", "b"]);
});

test("superadmin sees all while total board retains overarching access", () => {
  for (const type of ["aktives-mitglied-fussball", "aktives-mitglied-tischtennis", "aktives-mitglied-gymnastik-damen", "aktives-mitglied-behindertensport", "trainer-werden", "passives-mitglied", "sonstiges"]) {
    assert.equal(canAccessMembershipRequestType({ roleKeys: ["superadmin"], requestType: type, action: "edit" }), true);
    assert.equal(can("vorstand", type), true);
  }
});

test("permissions alone and unknown request types never grant access", () => {
  assert.deepEqual(getAllowedMembershipRequestTypes({ roleKeys: ["kassierer"], permissionKeys: permissions }), []);
  assert.equal(can("tischtennis-vorstand", "manipulated"), false);
  assert.equal(canAccessMembershipRequestType({ roleKeys: ["superadmin"], requestType: "unexpected-legacy", action: "view" }), true);
  assert.equal(canAccessMembershipRequestType({ roleKeys: ["tischtennis-vorstand"], permissionKeys: [], requestType: "aktives-mitglied-tischtennis" }), false);
});

test("notification roles are request-bound and preserve the existing superadmin delivery", () => {
  assert.deepEqual(getMembershipNotificationRoleKeys("aktives-mitglied-fussball"), ["jugendleiter", "jugendkoordinator", "fussball-vorstand", "superadmin"]);
  assert.deepEqual(getMembershipNotificationRoleKeys("aktives-mitglied-tischtennis"), ["tischtennis-vorstand", "superadmin"]);
  assert.deepEqual(getMembershipNotificationRoleKeys("trainer-werden"), ["vorstand", "superadmin"]);
  assert.deepEqual(getMembershipNotificationRoleKeys("sonstiges"), ["vorstand", "superadmin"]);
  assert.deepEqual(getMembershipNotificationRoleKeys("unknown"), ["superadmin"]);
  assert.equal(resolveMembershipResponsibility("passives-mitglied").key, "club-board");
});

test("notification recipients follow responsibility, permissions, activity and user-id deduplication", () => {
  const candidates = [
    { userId: "super", roleKeys: ["superadmin", "fussball-vorstand"], permissionKeys: [] },
    { userId: "football", roleKeys: ["fussball-vorstand"], permissionKeys: permissions },
    { userId: "football", roleKeys: ["jugendleiter"], permissionKeys: permissions },
    { userId: "table", roleKeys: ["tischtennis-vorstand"], permissionKeys: permissions },
    { userId: "inactive", isActive: false, roleKeys: ["fussball-vorstand"], permissionKeys: permissions },
    { userId: "no-view", roleKeys: ["jugendleiter"], permissionKeys: ["membership_requests.edit"] },
  ];
  assert.deepEqual(resolveMembershipNotificationRecipients(candidates, "aktives-mitglied-fussball").map((item) => item.userId), ["super", "football"]);
  assert.deepEqual(resolveMembershipNotificationRecipients(candidates, "aktives-mitglied-fussball", { actorUserId: "football" }).map((item) => item.userId), ["super"]);
});

test("trainer and passive notifications stay with total board and superadmin", () => {
  const candidates = ["vorstand", "fussball-vorstand", "tischtennis-vorstand", "damen-gymnastik-vorstand", "behindertensport-vorstand", "superadmin"]
    .map((role) => ({ userId: role, roleKeys: [role], permissionKeys: permissions }));
  for (const requestType of ["trainer-werden", "passives-mitglied"]) {
    assert.deepEqual(resolveMembershipNotificationRecipients(candidates, requestType).map((item) => item.userId), ["vorstand", "superadmin"]);
  }
});

test("department notification audiences do not leak across request types", () => {
  const candidates = ["jugendleiter", "fussball-vorstand", "tischtennis-vorstand", "damen-gymnastik-vorstand", "behindertensport-vorstand", "vorstand", "superadmin"]
    .map((role) => ({ userId: role, roleKeys: [role], permissionKeys: permissions }));
  const expected = {
    "aktives-mitglied-fussball": ["jugendleiter", "fussball-vorstand", "superadmin"],
    "aktives-mitglied-tischtennis": ["tischtennis-vorstand", "superadmin"],
    "aktives-mitglied-gymnastik-damen": ["damen-gymnastik-vorstand", "superadmin"],
    "aktives-mitglied-behindertensport": ["behindertensport-vorstand", "superadmin"],
  };
  for (const [requestType, userIds] of Object.entries(expected)) {
    assert.deepEqual(resolveMembershipNotificationRecipients(candidates, requestType).map((item) => item.userId), userIds);
  }
});
