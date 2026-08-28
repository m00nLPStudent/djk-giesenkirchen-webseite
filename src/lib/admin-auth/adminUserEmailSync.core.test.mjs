import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeLoginEmail,
  synchronizeAdminUserEmail,
  validateLoginEmail,
} from "./adminUserEmailSync.core.mjs";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ID = "22222222-2222-4222-8222-222222222222";

function createHarness(overrides = {}) {
  const state = {
    authEmail: "old@example.test",
    profileEmail: "old@example.test",
    calls: [],
  };
  const dependencies = {
    async loadAuthUser(userId) {
      state.calls.push(["loadAuthUser", userId]);
      return { ok: true, user: { id: USER_ID, email: state.authEmail } };
    },
    async loadProfile(userId) {
      state.calls.push(["loadProfile", userId]);
      return { ok: true, profile: { id: USER_ID, email: state.profileEmail } };
    },
    async hasAuthEmailConflict(email, userId) {
      state.calls.push(["hasAuthEmailConflict", email, userId]);
      return { ok: true, conflict: false };
    },
    async hasProfileEmailConflict(email, userId) {
      state.calls.push(["hasProfileEmailConflict", email, userId]);
      return { ok: true, conflict: false };
    },
    async updateAuthEmail(userId, email) {
      state.calls.push(["updateAuthEmail", userId, email]);
      state.authEmail = email;
      return { ok: true };
    },
    async updateProfileEmail(userId, email) {
      state.calls.push(["updateProfileEmail", userId, email]);
      state.profileEmail = email;
      return { ok: true };
    },
    ...overrides,
  };
  return { state, dependencies };
}

test("normalizes, validates and bounds login email", () => {
  assert.equal(normalizeLoginEmail("  New@Example.TEST "), "new@example.test");
  assert.equal(validateLoginEmail("").ok, false);
  assert.equal(validateLoginEmail("invalid").ok, false);
  assert.equal(validateLoginEmail(`${"a".repeat(250)}@x.de`).ok, false);
  assert.equal(validateLoginEmail("valid@example.test").ok, true);
});

test("rejects a malformed target and never addresses a user by email", async () => {
  const { state, dependencies } = createHarness();
  const result = await synchronizeAdminUserEmail({
    targetUserId: "not-a-uuid",
    requestedEmail: "new@example.test",
    dependencies,
  });
  assert.equal(result.reason, "invalid-target");
  assert.deepEqual(state.calls, []);
});

test("same address is a case-insensitive no-op", async () => {
  const { state, dependencies } = createHarness();
  const result = await synchronizeAdminUserEmail({
    targetUserId: USER_ID,
    requestedEmail: " OLD@EXAMPLE.TEST ",
    dependencies,
  });
  assert.deepEqual(result, {
    ok: true,
    changed: false,
    message: "Keine Änderung erkannt.",
  });
  assert.equal(state.calls.some(([name]) => name.startsWith("update")), false);
});

test("fails closed for missing or inconsistent UUID-bound state", async () => {
  const missing = createHarness({
    async loadAuthUser() {
      return { ok: false, user: null };
    },
  });
  assert.equal(
    (
      await synchronizeAdminUserEmail({
        targetUserId: USER_ID,
        requestedEmail: "new@example.test",
        dependencies: missing.dependencies,
      })
    ).reason,
    "user-not-found",
  );

  const mismatchedId = createHarness({
    async loadProfile() {
      return {
        ok: true,
        profile: { id: OTHER_ID, email: "old@example.test" },
      };
    },
  });
  assert.equal(
    (
      await synchronizeAdminUserEmail({
        targetUserId: USER_ID,
        requestedEmail: "new@example.test",
        dependencies: mismatchedId.dependencies,
      })
    ).reason,
    "inconsistent-state",
  );

  const mismatchedEmail = createHarness();
  mismatchedEmail.state.profileEmail = "different@example.test";
  assert.equal(
    (
      await synchronizeAdminUserEmail({
        targetUserId: USER_ID,
        requestedEmail: "new@example.test",
        dependencies: mismatchedEmail.dependencies,
      })
    ).reason,
    "inconsistent-state",
  );
});

test("rejects Auth and profile conflicts before mutation", async () => {
  for (const conflictMethod of [
    "hasAuthEmailConflict",
    "hasProfileEmailConflict",
  ]) {
    const harness = createHarness({
      async [conflictMethod]() {
        return { ok: true, conflict: true };
      },
    });
    const result = await synchronizeAdminUserEmail({
      targetUserId: USER_ID,
      requestedEmail: "new@example.test",
      dependencies: harness.dependencies,
    });
    assert.equal(result.reason, "email-conflict");
    assert.equal(
      harness.state.calls.some(([name]) => name.startsWith("update")),
      false,
    );
  }
});

test("updates Auth first, verifies, mirrors only email and verifies both", async () => {
  const { state, dependencies } = createHarness();
  const result = await synchronizeAdminUserEmail({
    targetUserId: USER_ID,
    requestedEmail: "NEW@example.test",
    dependencies,
  });
  assert.equal(result.ok, true);
  assert.equal(result.changed, true);
  const mutationCalls = state.calls.filter(([name]) => name.startsWith("update"));
  assert.deepEqual(mutationCalls, [
    ["updateAuthEmail", USER_ID, "new@example.test"],
    ["updateProfileEmail", USER_ID, "new@example.test"],
  ]);
  assert.equal(state.authEmail, "new@example.test");
  assert.equal(state.profileEmail, "new@example.test");
});

test("does not touch profile when Auth update fails", async () => {
  const harness = createHarness({
    async updateAuthEmail(userId, email) {
      harness.state.calls.push(["updateAuthEmail", userId, email]);
      return { ok: false };
    },
  });
  const result = await synchronizeAdminUserEmail({
    targetUserId: USER_ID,
    requestedEmail: "new@example.test",
    dependencies: harness.dependencies,
  });
  assert.equal(result.reason, "auth-update-failed");
  assert.equal(
    harness.state.calls.some(([name]) => name === "updateProfileEmail"),
    false,
  );
});

test("failed Auth verification requests E3-controlled compensation without reversing directly", async () => {
  const harness = createHarness();
  let authReads = 0;
  harness.dependencies.loadAuthUser = async () => {
    authReads += 1;
    if (authReads === 2) {
      return { ok: true, user: { id: USER_ID, email: "unexpected@example.test" } };
    }
    return { ok: true, user: { id: USER_ID, email: harness.state.authEmail } };
  };
  const result = await synchronizeAdminUserEmail({
    targetUserId: USER_ID,
    requestedEmail: "new@example.test",
    dependencies: harness.dependencies,
  });
  assert.equal(result.reason, "auth-verification-failed");
  assert.equal(result.requiresCompensation, true);
  assert.equal(harness.state.authEmail, "new@example.test");
  assert.equal(harness.state.profileEmail, "old@example.test");
  assert.deepEqual(
    harness.state.calls.filter(([name]) => name === "updateAuthEmail"),
    [["updateAuthEmail", USER_ID, "new@example.test"]],
  );
});

test("profile failures request compensation and never perform a direct reverse", async () => {
  const failed = createHarness({
    async updateProfileEmail() {
      return { ok: false };
    },
  });
  const result = await synchronizeAdminUserEmail({
    targetUserId: USER_ID,
    requestedEmail: "new@example.test",
    dependencies: failed.dependencies,
  });
  assert.equal(result.reason, "profile-update-failed");
  assert.equal(result.requiresCompensation, true);
  assert.equal(result.requiresManualReview, true);
  assert.equal(failed.state.authEmail, "new@example.test");
  assert.deepEqual(
    failed.state.calls.filter(([name]) => name === "updateAuthEmail"),
    [["updateAuthEmail", USER_ID, "new@example.test"]],
  );
  assert.doesNotMatch(result.message, /example\.test|supabase/i);
});
