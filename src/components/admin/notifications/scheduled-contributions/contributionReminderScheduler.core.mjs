import { timingSafeEqual } from "node:crypto";
import { getBerlinDate, isBerlinDispatchWindow } from "./scheduledContributionReminder.core.mjs";

export function isAuthorizedSchedulerRequest(header, expected) {
  const actual = String(header || "");
  const secret = String(expected || "");
  if (!actual.startsWith("Bearer ") || !secret) return false;
  const token = Buffer.from(actual.slice(7));
  const expectedToken = Buffer.from(secret);
  return token.length === expectedToken.length && timingSafeEqual(token, expectedToken);
}

export function createSchedulerContext(now = new Date()) {
  return { businessDate: getBerlinDate(now), shouldDispatch: isBerlinDispatchWindow(now), timezone: "Europe/Berlin" };
}

export function publicRunReport(report = {}) {
  return {
    ok: report.ok === true,
    runId: report.runId || null,
    businessDate: report.businessDate || null,
    scannedCount: Number(report.scannedCount || 0),
    eligibleCount: Number(report.eligibleCount || 0),
    deliveredCount: Number(report.deliveredCount || 0),
    duplicateCount: Number(report.duplicateCount || 0),
    preferenceSkippedCount: Number(report.preferenceSkippedCount || 0),
    failedCount: Number(report.failedCount || 0),
    durationMs: Number(report.durationMs || 0),
  };
}
