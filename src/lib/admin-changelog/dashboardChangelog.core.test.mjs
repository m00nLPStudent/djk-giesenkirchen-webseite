import test from "node:test";
import assert from "node:assert/strict";
import { CURRENT_DASHBOARD_CHANGELOG } from "./dashboardChangelog.config.mjs";
import {
  isSuccessfulDashboardChangelogAcknowledgement,
  runDashboardChangelogAcknowledgement,
  shouldShowDashboardChangelog,
} from "./dashboardChangelog.core.mjs";

test("missing and older acknowledgements show the current changelog", () => {
  assert.equal(shouldShowDashboardChangelog(null), true);
  assert.equal(shouldShowDashboardChangelog("1.0.1"), true);
  assert.equal(shouldShowDashboardChangelog("1.0.2"), true);
  assert.equal(shouldShowDashboardChangelog("1.0.3"), true);
  assert.equal(shouldShowDashboardChangelog("1.0.4"), true);
  assert.equal(shouldShowDashboardChangelog("1.0.5"), true);
  assert.equal(shouldShowDashboardChangelog("1.0.6"), true);
});

test("the current acknowledgement suppresses the changelog", () => {
  assert.equal(
    shouldShowDashboardChangelog(CURRENT_DASHBOARD_CHANGELOG.version),
    false,
  );
});

test("only the exact current RPC return value is accepted", () => {
  assert.equal(isSuccessfulDashboardChangelogAcknowledgement("1.0.7"), true);
  assert.equal(isSuccessfulDashboardChangelogAcknowledgement("1.0.6"), false);
  assert.equal(isSuccessfulDashboardChangelogAcknowledgement("1.0.5"), false);
  assert.equal(isSuccessfulDashboardChangelogAcknowledgement("1.0.4"), false);
  assert.equal(isSuccessfulDashboardChangelogAcknowledgement("1.0.3"), false);
  assert.equal(isSuccessfulDashboardChangelogAcknowledgement("1.0.2"), false);
  assert.equal(isSuccessfulDashboardChangelogAcknowledgement("1.0.1"), false);
  assert.equal(isSuccessfulDashboardChangelogAcknowledgement(null), false);
});

test("acknowledgement calls the RPC once with only the centrally configured version", async () => {
  const calls = [];
  const result = await runDashboardChangelogAcknowledgement(async (...args) => {
    calls.push(args);
    return { data: args[0], error: null };
  });

  assert.deepEqual(calls, [[CURRENT_DASHBOARD_CHANGELOG.version]]);
  assert.deepEqual(result, {
    ok: true,
    version: CURRENT_DASHBOARD_CHANGELOG.version,
  });
});

test("RPC errors and mismatched return values never acknowledge the release", async () => {
  assert.deepEqual(
    await runDashboardChangelogAcknowledgement(async () => ({
      data: null,
      error: new Error("failed"),
    })),
    { ok: false },
  );
  assert.deepEqual(
    await runDashboardChangelogAcknowledgement(async () => ({
      data: "1.0.0",
      error: null,
    })),
    { ok: false },
  );
});

test("the current release has complete user-facing content", () => {
  assert.equal(CURRENT_DASHBOARD_CHANGELOG.version, "1.0.7");
  assert.equal(CURRENT_DASHBOARD_CHANGELOG.releaseDate, "2026-09-25");
  assert.equal(CURRENT_DASHBOARD_CHANGELOG.title, "Neu im Dashboard");
  assert.equal(CURRENT_DASHBOARD_CHANGELOG.entries.length, 1);
  assert.deepEqual(
    CURRENT_DASHBOARD_CHANGELOG.entries.map((entry) => entry.title),
    ["Einheitliche Trainer- und Vorstandskarten"],
  );
  for (const entry of CURRENT_DASHBOARD_CHANGELOG.entries) {
    assert.ok(entry.title);
    assert.ok(entry.description);
  }
});
