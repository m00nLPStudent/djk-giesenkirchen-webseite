import assert from "node:assert/strict";
import test from "node:test";
import {
  EMAIL_CHANGE_CONFIRMATION_TTL_MINUTES,
  createEmailChangeToken,
  executeAdminEmailChangeConfirmation,
  executeAdminEmailChangeRequest,
  hashEmailChangeToken,
  inspectAdminEmailChangeToken,
} from "./adminEmailChange.core.mjs";

const ACTOR_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "22222222-2222-4222-8222-222222222222";
const REQUEST_ID = "33333333-3333-4333-8333-333333333333";
const NOW = new Date("2026-08-28T10:00:00.000Z");
const RAW_TOKEN = "A".repeat(43);

function requestDeps(overrides = {}) {
  const calls = [];
  return {
    calls,
    loadAuthUser: async () => ({ ok: true, user: { id: USER_ID, email: "old@example.test" } }),
    loadProfile: async () => ({ ok: true, profile: { id: USER_ID, email: "old@example.test" } }),
    hasAuthEmailConflict: async () => ({ ok: true, conflict: false }),
    hasProfileEmailConflict: async () => ({ ok: true, conflict: false }),
    loadActiveRequest: async () => ({ ok: true, request: null }),
    expireRequest: async (id) => (calls.push(["expired", id]), { ok: true }),
    cancelRequest: async (id) => (calls.push(["cancelled", id]), { ok: true }),
    createRequest: async (payload) => (calls.push(["created", payload]), { ok: true, request: { id: REQUEST_ID } }),
    failRequest: async (id, code) => (calls.push(["failed", id, code]), { ok: true }),
    sendOldAddressWarning: async (input) => (calls.push(["old-mail", input]), { ok: true }),
    sendNewAddressConfirmation: async (input) => (calls.push(["new-mail", input]), { ok: true }),
    ...overrides,
  };
}

function requestInput(dependencies, overrides = {}) {
  return {
    actorUserId: ACTOR_ID,
    targetUserId: USER_ID,
    requestedEmail: "NEW@EXAMPLE.TEST ",
    confirmationBaseUrl: "https://club.example.test/auth/confirm-email-change",
    dependencies,
    now: () => NOW,
    createToken: () => RAW_TOKEN,
    ...overrides,
  };
}

test("token is cryptographically generated and persisted only as SHA-256 lowercase hex", () => {
  const generated = createEmailChangeToken();
  assert.match(generated, /^[A-Za-z0-9_-]{32,256}$/);
  assert.match(hashEmailChangeToken(generated), /^[0-9a-f]{64}$/);
  assert.notEqual(hashEmailChangeToken(generated), generated);
});

test("request stores normalized pending state with one 15-minute TTL and keeps old state unchanged", async () => {
  const deps = requestDeps();
  const result = await executeAdminEmailChangeRequest(requestInput(deps));
  assert.equal(result.ok, true);
  const payload = deps.calls.find(([type]) => type === "created")[1];
  assert.deepEqual(
    { user_id: payload.user_id, requested_by: payload.requested_by, old_email: payload.old_email, new_email: payload.new_email, status: payload.status },
    { user_id: USER_ID, requested_by: ACTOR_ID, old_email: "old@example.test", new_email: "new@example.test", status: "pending" },
  );
  assert.equal(payload.token_hash, hashEmailChangeToken(RAW_TOKEN));
  assert.equal(new Date(payload.expires_at).getTime() - NOW.getTime(), EMAIL_CHANGE_CONFIRMATION_TTL_MINUTES * 60 * 1000);
  assert.doesNotMatch(JSON.stringify(payload), new RegExp(RAW_TOKEN));
  assert.deepEqual(deps.calls.filter(([type]) => type.endsWith("mail")).map(([type]) => type), ["old-mail", "new-mail"]);
  assert.doesNotMatch(JSON.stringify(deps.calls.find(([type]) => type === "old-mail")), /token=/);
  assert.match(deps.calls.find(([type]) => type === "new-mail")[1].confirmationUrl, /token=/);
});

test("request rejects invalid target, empty or malformed email and same-address no-op", async () => {
  const deps = requestDeps();
  assert.equal((await executeAdminEmailChangeRequest(requestInput(deps, { targetUserId: "bad" }))).reason, "invalid-target");
  assert.equal((await executeAdminEmailChangeRequest(requestInput(deps, { requestedEmail: "" }))).reason, "invalid-email");
  assert.equal((await executeAdminEmailChangeRequest(requestInput(deps, { requestedEmail: "bad" }))).reason, "invalid-email");
  const noOp = await executeAdminEmailChangeRequest(requestInput(deps, { requestedEmail: " OLD@example.test " }));
  assert.deepEqual({ ok: noOp.ok, changed: noOp.changed }, { ok: true, changed: false });
  assert.equal(deps.calls.length, 0);
});

test("request fails closed for missing user, auth/profile mismatch and either conflict", async () => {
  const missing = requestDeps({ loadAuthUser: async () => ({ ok: false }) });
  assert.equal((await executeAdminEmailChangeRequest(requestInput(missing))).reason, "user-not-found");
  const mismatch = requestDeps({ loadProfile: async () => ({ ok: true, profile: { id: USER_ID, email: "other@example.test" } }) });
  assert.equal((await executeAdminEmailChangeRequest(requestInput(mismatch))).reason, "inconsistent-state");
  const authConflict = requestDeps({ hasAuthEmailConflict: async () => ({ ok: true, conflict: true }) });
  assert.equal((await executeAdminEmailChangeRequest(requestInput(authConflict))).reason, "email-conflict");
  const profileConflict = requestDeps({ hasProfileEmailConflict: async () => ({ ok: true, conflict: true }) });
  assert.equal((await executeAdminEmailChangeRequest(requestInput(profileConflict))).reason, "email-conflict");
});

test("request expires stale pending, replaces valid pending and protects confirming", async () => {
  const stale = requestDeps({ loadActiveRequest: async () => ({ ok: true, request: { id: REQUEST_ID, status: "pending", expires_at: "2026-08-28T09:59:00Z" } }) });
  assert.equal((await executeAdminEmailChangeRequest(requestInput(stale))).ok, true);
  assert.equal(stale.calls[0][0], "expired");
  const valid = requestDeps({ loadActiveRequest: async () => ({ ok: true, request: { id: REQUEST_ID, status: "pending", expires_at: "2026-08-28T10:05:00Z" } }) });
  assert.equal((await executeAdminEmailChangeRequest(requestInput(valid))).ok, true);
  assert.equal(valid.calls[0][0], "cancelled");
  const confirming = requestDeps({ loadActiveRequest: async () => ({ ok: true, request: { id: REQUEST_ID, status: "confirming", expires_at: "2026-08-28T10:05:00Z" } }) });
  assert.equal((await executeAdminEmailChangeRequest(requestInput(confirming))).reason, "confirmation-in-progress");
  assert.equal(confirming.calls.length, 0);
  const compensating = requestDeps({ loadActiveRequest: async () => ({ ok: true, request: { id: REQUEST_ID, status: "compensating", expires_at: "2026-08-28T10:05:00Z" } }) });
  assert.equal((await executeAdminEmailChangeRequest(requestInput(compensating))).reason, "confirmation-in-progress");
  assert.equal(compensating.calls.length, 0);
});

test("either request mail failure terminalizes request and blocks later mail", async () => {
  const oldFailure = requestDeps({ sendOldAddressWarning: async () => ({ ok: false }) });
  assert.equal((await executeAdminEmailChangeRequest(requestInput(oldFailure))).reason, "mail-delivery-failed");
  assert.deepEqual(oldFailure.calls.at(-1), ["failed", REQUEST_ID, "old_mail_failed"]);
  assert.equal(oldFailure.calls.some(([type]) => type === "new-mail"), false);
  const newFailure = requestDeps({ sendNewAddressConfirmation: async () => ({ ok: false }) });
  assert.equal((await executeAdminEmailChangeRequest(requestInput(newFailure))).reason, "mail-delivery-failed");
  assert.deepEqual(newFailure.calls.at(-1), ["failed", REQUEST_ID, "confirmation_mail_failed"]);
});

function confirmationDeps(overrides = {}) {
  const calls = [];
  const request = { id: REQUEST_ID, user_id: USER_ID, requested_by: ACTOR_ID, old_email: "old@example.test", new_email: "new@example.test", status: "confirming", expires_at: "2026-08-28T10:15:00Z", confirmed_at: NOW.toISOString(), completed_at: null, locked_at: NOW.toISOString(), compensation_started_at: null };
  return {
    calls,
    findRequestByTokenHash: async () => ({ ok: true, request: { status: "pending", expires_at: request.expires_at } }),
    claimRequest: async () => (calls.push(["claim"]), { ok: true, request }),
    expireRequestByTokenHash: async () => ({ ok: true, expired: false }),
    validateRequester: async () => ({ ok: true }),
    loadAuthUser: async () => ({ ok: true, user: { id: USER_ID, email: request.old_email } }),
    loadProfile: async () => ({ ok: true, profile: { id: USER_ID, email: request.old_email } }),
    hasAuthEmailConflict: async () => ({ ok: true, conflict: false }),
    hasProfileEmailConflict: async () => ({ ok: true, conflict: false }),
    finalizeEmailChange: async (input) => (calls.push(["finalize", input]), { ok: true, changed: true }),
    completeRequest: async () => (calls.push(["complete"]), { ok: true }),
    failRequest: async (_id, code) => (calls.push(["fail", code]), { ok: true }),
    claimCompensation: async (input) => {
      calls.push(["compensation-claim", input]);
      return { ok: true, request: { ...request, status: "compensating", compensation_started_at: input.compensationStartedAt } };
    },
    reverseAuthEmail: async (input) => (calls.push(["reverse", input]), { ok: true }),
    finishCompensation: async (_id, code) => (calls.push(["compensation-finished", code]), { ok: true }),
    sendOldAddressCompletion: async () => (calls.push(["old-completion"]), { ok: true }),
    sendNewAddressCompletion: async () => (calls.push(["new-completion"]), { ok: true }),
    ...overrides,
  };
}

test("GET inspection is read-only and distinguishes valid, expired and neutral invalid states", async () => {
  const valid = confirmationDeps();
  assert.deepEqual(await inspectAdminEmailChangeToken({ token: RAW_TOKEN, dependencies: valid, now: () => NOW }), { status: "valid" });
  assert.equal(valid.calls.length, 0);
  const expired = confirmationDeps({ findRequestByTokenHash: async () => ({ ok: true, request: { status: "pending", expires_at: "2026-08-28T09:59:00Z" } }) });
  assert.deepEqual(await inspectAdminEmailChangeToken({ token: RAW_TOKEN, dependencies: expired, now: () => NOW }), { status: "expired" });
  for (const status of ["cancelled", "completed", "failed", "confirming"]) {
    const deps = confirmationDeps({ findRequestByTokenHash: async () => ({ ok: true, request: { status, expires_at: "2026-08-28T10:15:00Z" } }) });
    assert.deepEqual(await inspectAdminEmailChangeToken({ token: RAW_TOKEN, dependencies: deps, now: () => NOW }), { status: "invalid" });
  }
  assert.deepEqual(await inspectAdminEmailChangeToken({ token: "wrong", dependencies: valid }), { status: "invalid" });
});

test("POST confirmation claims once, revalidates, finalizes through E2 and completes before mails", async () => {
  const deps = confirmationDeps();
  const result = await executeAdminEmailChangeConfirmation({ token: RAW_TOKEN, dependencies: deps, now: () => NOW });
  assert.equal(result.status, "completed");
  assert.deepEqual(deps.calls.map(([type]) => type), ["claim", "finalize", "complete", "old-completion", "new-completion"]);
  assert.deepEqual(deps.calls[1][1], { targetUserId: USER_ID, requestedEmail: "new@example.test" });
});

test("invalid, expired, replayed or parallel POST never finalizes", async () => {
  assert.equal((await executeAdminEmailChangeConfirmation({ token: "bad", dependencies: confirmationDeps() })).status, "invalid");
  const expired = confirmationDeps({ claimRequest: async () => ({ ok: false, request: null }), expireRequestByTokenHash: async () => ({ ok: true, expired: true }) });
  assert.equal((await executeAdminEmailChangeConfirmation({ token: RAW_TOKEN, dependencies: expired })).status, "expired");
  const lostClaim = confirmationDeps({ claimRequest: async () => ({ ok: false, request: null }) });
  assert.equal((await executeAdminEmailChangeConfirmation({ token: RAW_TOKEN, dependencies: lostClaim })).status, "invalid");
  assert.equal(lostClaim.calls.some(([type]) => type === "finalize"), false);
});

test("confirmation rejects revoked requester, missing target, changed old state and new conflicts", async () => {
  const cases = [
    ["requester_not_authorized", { validateRequester: async () => ({ ok: false }) }],
    ["target_missing", { loadAuthUser: async () => ({ ok: false }) }],
    ["state_changed", { loadProfile: async () => ({ ok: true, profile: { id: USER_ID, email: "changed@example.test" } }) }],
    ["target_email_conflict", { hasAuthEmailConflict: async () => ({ ok: true, conflict: true }) }],
  ];
  for (const [failure, overrides] of cases) {
    const deps = confirmationDeps(overrides);
    assert.equal((await executeAdminEmailChangeConfirmation({ token: RAW_TOKEN, dependencies: deps })).status, "failed");
    assert.equal(deps.calls.some(([type, code]) => type === "fail" && code === failure), true);
    assert.equal(deps.calls.some(([type]) => type === "finalize"), false);
  }
});

test("failure before Auth forward terminalizes without a compensation claim", async () => {
  const deps = confirmationDeps({ finalizeEmailChange: async () => ({ ok: false, reason: "auth-update-failed" }) });
  assert.equal((await executeAdminEmailChangeConfirmation({ token: RAW_TOKEN, dependencies: deps, now: () => NOW })).status, "failed");
  assert.equal(deps.calls.some(([type]) => type === "compensation-claim" || type === "reverse"), false);
});

test("E2 failure claims confirming before reverse and terminalizes with retained audit code", async () => {
  const deps = confirmationDeps({
    finalizeEmailChange: async (input) => (deps.calls.push(["finalize", input]), { ok: false, reason: "profile-update-failed", requiresCompensation: true }),
  });
  const result = await executeAdminEmailChangeConfirmation({ token: RAW_TOKEN, dependencies: deps, now: () => NOW });
  assert.equal(result.status, "failed");
  assert.deepEqual(deps.calls.map(([type]) => type), ["claim", "finalize", "compensation-claim", "reverse", "compensation-finished"]);
  const claim = deps.calls.find(([type]) => type === "compensation-claim")[1];
  assert.deepEqual(
    { requestId: claim.requestId, userId: claim.userId, oldEmail: claim.oldEmail, newEmail: claim.newEmail, workflowTimestamp: claim.workflowTimestamp, allowCompleted: claim.allowCompleted },
    { requestId: REQUEST_ID, userId: USER_ID, oldEmail: "old@example.test", newEmail: "new@example.test", workflowTimestamp: NOW.toISOString(), allowCompleted: false },
  );
  assert.deepEqual(deps.calls.find(([type]) => type === "reverse")[1], {
    userId: USER_ID,
    expectedCurrentEmail: "new@example.test",
    originalEmail: "old@example.test",
  });
  assert.deepEqual(deps.calls.find(([type]) => type === "compensation-finished"), ["compensation-finished", "email_sync_failed_compensated"]);
});

test("claim read-after-write mismatch fails closed before reverse", async () => {
  for (const mismatch of [
    { id: "44444444-4444-4444-8444-444444444444" },
    { user_id: ACTOR_ID },
    { old_email: "wrong@example.test" },
    { new_email: "wrong@example.test" },
    { status: "failed" },
    { confirmed_at: "2026-08-28T09:59:00.000Z" },
    { compensation_started_at: "2026-08-28T09:59:00.000Z" },
    { locked_at: null },
  ]) {
    const deps = confirmationDeps({
      finalizeEmailChange: async () => ({ ok: false, reason: "profile-update-failed", requiresCompensation: true }),
      claimCompensation: async (input) => ({ ok: true, request: { id: REQUEST_ID, user_id: USER_ID, old_email: "old@example.test", new_email: "new@example.test", status: "compensating", confirmed_at: NOW.toISOString(), compensation_started_at: input.compensationStartedAt, locked_at: NOW.toISOString(), ...mismatch } }),
    });
    await executeAdminEmailChangeConfirmation({ token: RAW_TOKEN, dependencies: deps, now: () => NOW });
    assert.equal(deps.calls.some(([type]) => type === "reverse"), false);
  }
});

test("completion ambiguity binds completed claim to the current workflow and reverses only after claim", async () => {
  const deps = confirmationDeps({ completeRequest: async () => (deps.calls.push(["complete"]), { ok: false }) });
  const result = await executeAdminEmailChangeConfirmation({ token: RAW_TOKEN, dependencies: deps, now: () => NOW });
  assert.equal(result.status, "failed");
  assert.equal(deps.calls.filter(([type]) => type === "finalize").length, 1);
  const claim = deps.calls.find(([type]) => type === "compensation-claim")[1];
  assert.equal(claim.allowCompleted, true);
  assert.equal(claim.workflowTimestamp, NOW.toISOString());
  assert.deepEqual(deps.calls.map(([type]) => type), ["claim", "finalize", "complete", "compensation-claim", "reverse", "compensation-finished"]);
  assert.deepEqual(deps.calls.find(([type]) => type === "compensation-finished"), ["compensation-finished", "completion_state_failed_compensated"]);
});

test("reverse or verify failure terminalizes once as compensation_failed", async () => {
  const deps = confirmationDeps({
    finalizeEmailChange: async () => ({ ok: false, reason: "profile-update-failed", requiresCompensation: true }),
    reverseAuthEmail: async (input) => (deps.calls.push(["reverse", input]), { ok: false }),
  });
  await executeAdminEmailChangeConfirmation({ token: RAW_TOKEN, dependencies: deps, now: () => NOW });
  assert.equal(deps.calls.filter(([type]) => type === "reverse").length, 1);
  assert.deepEqual(deps.calls.find(([type]) => type === "compensation-finished"), ["compensation-finished", "compensation_failed"]);
});

test("parallel confirmations permit only one compensation claim and one reverse", async () => {
  let claimWon = false;
  const deps = confirmationDeps({
    finalizeEmailChange: async () => ({ ok: false, reason: "profile-update-failed", requiresCompensation: true }),
    claimCompensation: async (input) => {
      if (claimWon) return { ok: false, request: null };
      claimWon = true;
      return { ok: true, request: { id: REQUEST_ID, user_id: USER_ID, old_email: "old@example.test", new_email: "new@example.test", status: "compensating", confirmed_at: NOW.toISOString(), compensation_started_at: input.compensationStartedAt, locked_at: NOW.toISOString() } };
    },
  });
  await Promise.all([
    executeAdminEmailChangeConfirmation({ token: RAW_TOKEN, dependencies: deps, now: () => NOW }),
    executeAdminEmailChangeConfirmation({ token: RAW_TOKEN, dependencies: deps, now: () => NOW }),
  ]);
  assert.equal(deps.calls.filter(([type]) => type === "reverse").length, 1);
});

test("completion-mail errors never trigger compensation", async () => {
  const mailFailure = confirmationDeps({ sendOldAddressCompletion: async () => ({ ok: false }), sendNewAddressCompletion: async () => ({ ok: false }) });
  assert.equal((await executeAdminEmailChangeConfirmation({ token: RAW_TOKEN, dependencies: mailFailure, now: () => NOW })).status, "completed");
  assert.equal(mailFailure.calls.some(([type]) => type === "compensation-claim" || type === "reverse"), false);
});
