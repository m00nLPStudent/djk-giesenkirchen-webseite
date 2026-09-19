import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [shell, context, gate, dialog, repository, service, config] =
  await Promise.all([
    read("../layout/AdminShell.js"),
    read("../auth/AdminUiContext.js"),
    read("./DashboardChangelogGate.js"),
    read("./DashboardChangelogDialog.js"),
    read("../../../lib/admin-changelog/dashboardChangelog.repository.js"),
    read("../../../lib/admin-changelog/dashboardChangelog.service.js"),
    read("../../../lib/admin-changelog/dashboardChangelog.config.mjs"),
  ]);

test("the gate is mounted once inside the central protected admin shell", () => {
  assert.match(shell, /<AdminUiContextProvider>/);
  assert.equal((shell.match(/<DashboardChangelogGate/g) || []).length, 1);
  assert.match(context, /updateOwnProfile/);
});

test("the gate waits for an active loaded profile and compares exact versions", () => {
  assert.match(gate, /isReady/);
  assert.match(gate, /hasAdminProfile/);
  assert.match(gate, /isActive/);
  assert.match(gate, /last_acknowledged_dashboard_changelog_version/);
  assert.match(gate, /shouldShowDashboardChangelog/);
});

test("acknowledgement uses only the controlled RPC version parameter", () => {
  assert.match(repository, /rpc\("acknowledge_own_dashboard_changelog"/);
  assert.match(repository, /p_version: version/);
  assert.doesNotMatch(repository, /user_?id|profile_?id/i);
  assert.match(service, /runDashboardChangelogAcknowledgement/);
});

test("success updates local profile state while failure keeps the dialog open", () => {
  assert.match(gate, /if \(!result\.ok\)/);
  assert.match(gate, /setError\(result\.error\)/);
  assert.match(gate, /updateOwnProfile/);
  assert.match(gate, /setConfirmedVersion\(result\.version\)/);
  assert.match(service, /runDashboardChangelogAcknowledgement/);
});

test("a synchronous lock and disabled loading state prevent duplicate submits", () => {
  assert.match(gate, /if \(submittingRef\.current\) return/);
  assert.match(gate, /submittingRef\.current = true/);
  assert.match(dialog, /disabled=\{busy\}/);
  assert.match(dialog, /Wird gespeichert/);
});

test("the modal is accessible, responsive and only confirmation can close it", () => {
  for (const marker of [
    'role="dialog"',
    'aria-modal="true"',
    "aria-labelledby",
    "aria-describedby",
    "focus",
    'event.key === "Escape"',
    "overflow-y-auto",
    "Verstanden",
  ]) {
    assert.ok(dialog.includes(marker), marker);
  }
  assert.doesNotMatch(dialog, /onClose|aria-label="Schließen"/);
});

test("version and visible copy have a single central source", () => {
  assert.match(config, /version: "1\.0\.2"/);
  assert.match(config, /Trainerübersicht verbessert/);
  assert.match(config, /Einheitliche Trainerdarstellung/);
  assert.match(config, /Mannschaftsbilder optimiert/);
  assert.match(config, /Spielerverwaltung verbessert/);
  assert.doesNotMatch(gate, /version:\s*"1\.0\.2"/);
  assert.doesNotMatch(dialog, /version:\s*"1\.0\.2"/);
});
