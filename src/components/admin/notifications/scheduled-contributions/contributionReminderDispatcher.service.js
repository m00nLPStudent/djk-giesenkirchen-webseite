import "server-only";
import { randomUUID } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import { createNotificationsOnce } from "../notifications.service";
import { createAdminNotificationRecipients, loadAdminNotificationRecipientSource } from "../workflowNotificationRecipients.repository";
import { resolveTeamNotificationRecipients } from "../teamAssignmentNotifications.service";
import { recordNotificationMonitoringEvent } from "../monitoring/notificationMonitoring.logger";
import { buildScheduledContributionNotification } from "./contributionReminder.builders.mjs";
import { loadContributionReminderBatch } from "./contributionReminder.repository";
import { classifyScheduledContributionReminder, createScheduledContributionIdempotencyKey } from "./scheduledContributionReminder.core.mjs";

const financeRecipient = (recipient) => recipient.permissionKeys.includes("contributions.view")
  && recipient.roleKeys.some((role) => ["superadmin", "kassierer", "vorstand"].includes(role));

const emptyReport = (context) => ({ ok: true, runId: randomUUID(), businessDate: context.businessDate, timezone: context.timezone, scannedCount: 0, eligibleCount: 0, excludedCounts: {}, stageCounts: {}, recipientCount: 0, deliveredCount: 0, duplicateCount: 0, preferenceSkippedCount: 0, failedCount: 0, durationMs: 0 });

export async function dispatchContributionReminders(context, { db = createSupabaseAdminClient() } = {}) {
  const started = Date.now();
  const report = emptyReport(context);
  if (!db) return { ...report, ok: false, failedCount: 1, errorClass: "admin_client_unavailable" };
  try {
    const adminSource = await loadAdminNotificationRecipientSource(db);
    if (adminSource.error) throw new Error("finance_recipient_resolution_failed");
    const finance = createAdminNotificationRecipients(adminSource.data).filter(financeRecipient).map((item) => ({ ...item, audience: "finance" }));
    let cursor = null;
    do {
      const batch = await loadContributionReminderBatch(db, { afterId: cursor });
      if (batch.error) throw new Error("contribution_batch_load_failed");
      cursor = batch.nextCursor;
      report.scannedCount += batch.data.length;
      const eligible = batch.data.flatMap((contribution) => {
        const reminder = classifyScheduledContributionReminder(contribution, context.businessDate);
        if (!reminder) { report.excludedCounts.not_due = (report.excludedCounts.not_due || 0) + 1; return []; }
        report.stageCounts[reminder.stage] = (report.stageCounts[reminder.stage] || 0) + 1;
        return [{ contribution, reminder }];
      });
      report.eligibleCount += eligible.length;
      const teamIds = [...new Set(eligible.flatMap((item) => item.contribution.teamSeasonIds))];
      const trainerResolution = await resolveTeamNotificationRecipients(db, teamIds, null);
      if (trainerResolution.error) throw new Error("trainer_recipient_resolution_failed");
      const inputs = [];
      for (const { contribution, reminder } of eligible) {
        const teamSet = new Set(contribution.teamSeasonIds);
        const trainers = trainerResolution.recipients.filter((item) => teamSet.has(item.teamSeasonId)).map((item) => ({ ...item, audience: "trainer" }));
        const recipients = [...new Map([...trainers, ...finance].map((item) => [item.userId, item])).values()];
        for (const recipient of recipients) {
          const idempotencyKey = createScheduledContributionIdempotencyKey({ type: reminder.type, contributionId: contribution.id, recipientUserId: recipient.userId, stage: reminder.stage, businessDate: context.businessDate, contributionYear: contribution.contributionYear });
          inputs.push(buildScheduledContributionNotification(contribution, reminder, recipient, { ...context, idempotencyKey }));
        }
      }
      report.recipientCount += inputs.length;
      if (inputs.length) {
        const delivered = await createNotificationsOnce(inputs, { db });
        report.deliveredCount += delivered.data?.length || 0;
        report.duplicateCount += delivered.duplicateCount || 0;
        report.preferenceSkippedCount += delivered.preferenceSkippedCount || 0;
        report.failedCount += delivered.failedCount || (delivered.error ? 1 : 0);
      }
    } while (cursor);
  } catch (error) {
    report.ok = false;
    report.failedCount += 1;
    report.errorClass = error.message || "dispatcher_failed";
  }
  report.durationMs = Date.now() - started;
  if (report.failedCount) report.ok = false;
  await recordNotificationMonitoringEvent({ type: "contribution_reminder_dispatch", status: report.ok ? "success" : report.deliveredCount ? "warning" : "failed", recipientCount: report.recipientCount, successCount: report.deliveredCount, failedCount: report.failedCount, duplicateCount: report.duplicateCount, skippedCount: report.preferenceSkippedCount, durationMs: report.durationMs, errorClass: report.errorClass || null, resolver: "scheduled-contribution-dispatcher", idempotencyKey: report.runId, preferenceAnalysis: { inputCount: report.recipientCount, skippedCount: report.preferenceSkippedCount, outputCount: report.deliveredCount }, dispatcherAnalysis: { runId: report.runId, businessDate: report.businessDate, timezone: report.timezone, scannedCount: report.scannedCount, eligibleCount: report.eligibleCount, excludedCounts: report.excludedCounts, stageCounts: report.stageCounts } }, { db });
  return report;
}
