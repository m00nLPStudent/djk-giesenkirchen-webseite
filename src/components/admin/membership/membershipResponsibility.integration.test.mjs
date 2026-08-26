import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("membership list applies allowed request types before returning client data", async () => {
  const loader = await read("./membershipRequests.loader.js");
  assert.match(loader, /getAllowedMembershipRequestTypes/);
  assert.match(loader, /\.in\("request_type", allowedRequestTypes\)/);
  assert.ok(loader.indexOf("canAccessMembershipRequests(context)") < loader.indexOf("createSupabaseAdminClient()"));
});

test("detail access authorizes request type before loading the complete record", async () => {
  const service = await read("./membershipRequestRecordAccess.service.js");
  const identity = service.indexOf('select("id, request_type, forwarded_to_type, forwarded_to_id")');
  const typeCheck = service.indexOf("canAccessMembershipRequestType({ requestType: requestIdentity.data.request_type");
  const fullRecord = service.indexOf('select("*, teams(name_de), team_seasons(name_de, seasons(name))")');
  assert.ok(identity >= 0 && typeCheck > identity && fullRecord > typeCheck);
  assert.match(service, /isMembershipRequestAssignedToCoach/);
});

test("status and forwarding mutations resolve the stored record and never trust the browser request", async () => {
  const actions = await read("../../../app/admin/membership-requests/actions.js");
  assert.equal((actions.match(/resolveMembershipRequestRecordAccess\(request\?\.id\)/g) || []).length, 2);
  assert.match(actions, /forwardMembershipRequest\(access\.request, target\.data, \{ client: access\.writeClient \}\)/);
  assert.doesNotMatch(actions, /forwardMembershipRequest\(request, payload/);
  assert.match(actions, /\["coach", "board"\][\s\S]*UUID_PATTERN/);
  assert.match(actions, /\.eq\("is_active", true\)/);
});

test("C1 SQL adds only roles and existing permission mappings while preserving membership hardening", async () => {
  const [proposal, postcheck] = await Promise.all([
    read("../../../../docs/sql/b15-21c1-membership-responsibility-roles-proposal.sql"),
    read("../../../../docs/sql/b15-21c1-membership-responsibility-roles-postcheck-readonly.sql"),
  ]);
  for (const role of ["tischtennis-vorstand", "damen-gymnastik-vorstand", "behindertensport-vorstand"]) assert.match(proposal, new RegExp(role));
  for (const permission of ["membership_requests.view", "membership_requests.edit", "membership_requests.forward"]) assert.match(proposal, new RegExp(permission.replace(".", "\\.")));
  assert.doesNotMatch(proposal, /GRANT|CREATE POLICY|ALTER TABLE public\.membership_requests|UPDATE public\.membership_requests|DELETE FROM public\.membership_requests/i);
  assert.match(postcheck, /relrowsecurity/);
  assert.match(postcheck, /anon[\s\S]*authenticated[\s\S]*service_role/);
});

test("C1 adds no browser database access or permissive membership policy", async () => {
  const [loader, record, notification] = await Promise.all([
    read("./membershipRequests.loader.js"),
    read("./membershipRequestRecordAccess.service.js"),
    read("../notifications/workflowNotifications.service.js"),
  ]);
  for (const source of [loader, record, notification]) assert.match(source, /server-only/);
  assert.doesNotMatch(notification, /desired_team_id|desired_team_season_id/);
});
