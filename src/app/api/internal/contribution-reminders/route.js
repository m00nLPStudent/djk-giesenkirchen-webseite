import { dispatchContributionReminders } from "@/components/admin/notifications/scheduled-contributions/contributionReminderDispatcher.service";
import { createSchedulerContext, isAuthorizedSchedulerRequest, publicRunReport } from "@/components/admin/notifications/scheduled-contributions/contributionReminderScheduler.core.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!isAuthorizedSchedulerRequest(request.headers.get("authorization"), process.env.CONTRIBUTION_REMINDER_CRON_SECRET)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const context = createSchedulerContext(new Date());
  if (!context.shouldDispatch) return Response.json({ ok: true, skipped: true, reason: "outside_business_window", businessDate: context.businessDate });
  const report = await dispatchContributionReminders(context);
  return Response.json(publicRunReport(report), { status: report.ok ? 200 : 500 });
}
