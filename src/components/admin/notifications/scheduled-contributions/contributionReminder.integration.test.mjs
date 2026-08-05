import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildScheduledContributionNotification } from "./contributionReminder.builders.mjs";

const contribution = { id: "c1", playerId: "p1", playerDisplayName: "Max Mustermann", dueDate: "2026-09-15", contributionYear: "2026", outstandingCents: 12345 };
const reminder = { type: "membership_payment_overdue", stage: "overdue_7" };
const context = { businessDate: "2026-09-22", idempotencyKey: "safe-key" };

test("trainer payload has no amount, payment detail, dunning stage or contribution route", () => {
  const payload = buildScheduledContributionNotification(contribution, reminder, { userId: "u1", audience: "trainer" }, context);
  const serialized = JSON.stringify(payload);
  assert.equal(payload.targetUrl, "/admin/notifications");
  assert.equal(serialized.includes("12345"), false);
  assert.equal(serialized.includes("overdue_7"), true); // technical metadata only
  assert.equal(payload.message.includes("Mahnstufe"), false);
});

test("finance payload contains no payment reference or internal note", () => {
  const payload = buildScheduledContributionNotification(contribution, reminder, { userId: "u2", audience: "finance" }, context);
  assert.equal(payload.targetUrl, "/admin/contributions/c1");
  assert.equal(Object.hasOwn(payload.metadata, "amount"), false);
  assert.equal(Object.hasOwn(payload.metadata, "paymentReference"), false);
});

test("repository is cursor-paged and batches related sources", async () => {
  const source = await readFile(new URL("./contributionReminder.repository.js", import.meta.url), "utf8");
  assert.match(source, /\.gt\("id", afterId\)/);
  assert.match(source, /CONTRIBUTION_REMINDER_BATCH_SIZE = 100/);
  assert.match(source, /player_team_seasons/);
  assert.doesNotMatch(source, /internal_notes|payment_method|reference/);
});

test("dispatcher reuses central preference, idempotency, audit, finance and team resolvers", async () => {
  const source = await readFile(new URL("./contributionReminderDispatcher.service.js", import.meta.url), "utf8");
  for (const dependency of ["createNotificationsOnce", "loadAdminNotificationRecipientSource", "resolveTeamNotificationRecipients", "recordNotificationMonitoringEvent"]) assert.match(source, new RegExp(dependency));
  assert.doesNotMatch(source, /\.from\("notifications"\)/);
});

test("route is POST-only, secret protected and returns sanitized reports", async () => {
  const source = await readFile(new URL("../../../../app/api/internal/contribution-reminders/route.js", import.meta.url), "utf8");
  assert.match(source, /export async function POST/);
  assert.doesNotMatch(source, /export async function GET/);
  assert.match(source, /CONTRIBUTION_REMINDER_CRON_SECRET/);
  assert.match(source, /publicRunReport/);
});

test("SQL preflight and postcheck are read-only while cron uses Vault and POST", async () => {
  const root = new URL("../../../../../docs/sql/", import.meta.url);
  const preflight = await readFile(new URL("b15-18j1-notification-idempotency-preflight-readonly.sql", root), "utf8");
  const cron = await readFile(new URL("b15-18j1-contribution-reminder-cron-proposal.sql", root), "utf8");
  assert.doesNotMatch(preflight, /\b(delete|update|insert|alter|drop|create)\b/i);
  assert.match(cron, /net\.http_post/);
  assert.match(cron, /vault\.decrypted_secrets/);
  assert.doesNotMatch(cron, /Bearer [A-Za-z0-9_-]{16,}/);
});
