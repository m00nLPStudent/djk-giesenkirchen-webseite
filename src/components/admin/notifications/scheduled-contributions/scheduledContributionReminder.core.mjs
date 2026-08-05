export const CONTRIBUTION_REMINDER_POLICY = Object.freeze({
  advanceDays: Object.freeze([14, 7]),
  firstOverdueDay: 7,
  recurringOverdueStartDay: 21,
  recurringOverdueIntervalDays: 14,
  timezone: "Europe/Berlin",
  businessHour: 8,
});

const excluded = new Set(["paid", "exempt", "canceled"]);
const dateOnly = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};
const daysBetween = (from, to) => Math.round((to - from) / 86400000);

export function getBerlinDate(value = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CONTRIBUTION_REMINDER_POLICY.timezone,
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(value);
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function getBerlinHour(value = new Date()) {
  return Number(new Intl.DateTimeFormat("en-GB", {
    timeZone: CONTRIBUTION_REMINDER_POLICY.timezone,
    hour: "2-digit", hourCycle: "h23",
  }).format(value));
}

export function isBerlinDispatchWindow(value = new Date()) {
  return getBerlinHour(value) === CONTRIBUTION_REMINDER_POLICY.businessHour;
}

export function isRecurringOverdueDay(daysOverdue, policy = CONTRIBUTION_REMINDER_POLICY) {
  return daysOverdue === policy.firstOverdueDay
    || (daysOverdue >= policy.recurringOverdueStartDay
      && (daysOverdue - policy.firstOverdueDay) % policy.recurringOverdueIntervalDays === 0);
}

export function classifyScheduledContributionReminder(contribution = {}, todayValue, policy = CONTRIBUTION_REMINDER_POLICY) {
  const today = dateOnly(todayValue);
  const due = dateOnly(contribution.dueDate);
  const deferredUntil = dateOnly(contribution.deferredUntil);
  const outstanding = Number(contribution.outstandingCents || 0);
  const status = contribution.status;
  if (!today || !due || outstanding <= 0 || excluded.has(status)) return null;
  if (status === "deferred") {
    if (!deferredUntil || deferredUntil > today) return null;
    if (daysBetween(today, deferredUntil) === 0) {
      return { type: "membership_payment_deferral_ending", stage: `deferral_${contribution.deferredUntil}` };
    }
    // The model does not define deferred_until as a replacement due date.
    // After it ends, the original due_date remains the conservative source of truth.
  }
  const relation = daysBetween(today, due);
  if (policy.advanceDays.includes(relation)) return { type: "membership_payment_due_soon", stage: `due_soon_${relation}` };
  if (relation === 0) return { type: "membership_payment_due_today", stage: "due_today" };
  const overdueDays = -relation;
  if (overdueDays > 0 && isRecurringOverdueDay(overdueDays, policy)) {
    return { type: status === "partially_paid" ? "membership_payment_partial_open" : "membership_payment_overdue", stage: `overdue_${overdueDays}` };
  }
  return null;
}

export function createScheduledContributionIdempotencyKey({ type, contributionId, recipientUserId, stage, businessDate, contributionYear }) {
  return [type, contributionId, recipientUserId, stage, businessDate, contributionYear].join(":");
}
