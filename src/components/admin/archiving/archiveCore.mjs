export const ARCHIVE_CODES = Object.freeze({
  SUCCESS: "SUCCESS",
  NOT_FOUND: "NOT_FOUND",
  TEAM_ALREADY_INACTIVE: "TEAM_ALREADY_INACTIVE",
  PLAYER_ALREADY_INACTIVE: "PLAYER_ALREADY_INACTIVE",
  COACH_ALREADY_INACTIVE: "COACH_ALREADY_INACTIVE",
  CURRENT_SEASON_MISSING: "CURRENT_SEASON_MISSING",
  CURRENT_SEASON_AMBIGUOUS: "CURRENT_SEASON_AMBIGUOUS",
  TEAM_SEASON_NOT_FOUND: "TEAM_SEASON_NOT_FOUND",
  ARCHIVE_CONFLICT: "ARCHIVE_CONFLICT",
  DATABASE_ERROR: "DATABASE_ERROR",
});

export function isOutstandingContribution(row = {}) {
  return ["open", "partially_paid", "deferred"].includes(row.status) &&
    Number(row.amount_outstanding || 0) > 0;
}

export function summarizeOutstandingContributions(rows = []) {
  const outstanding = rows.filter(isOutstandingContribution);
  return {
    count: outstanding.length,
    amount: outstanding.reduce(
      (sum, row) => sum + Number(row.amount_outstanding || 0),
      0,
    ),
  };
}

export function archiveResult(code, message, details = null) {
  return { ok: code === ARCHIVE_CODES.SUCCESS, code, message, details };
}

export async function runArchiveSteps(steps, rollback) {
  try {
    for (const step of steps) await step();
    return null;
  } catch (error) {
    try {
      await rollback();
    } catch {
      return archiveResult(
        ARCHIVE_CODES.ARCHIVE_CONFLICT,
        "Die Archivierung war unvollstaendig und konnte nicht vollstaendig zurueckgerollt werden.",
      );
    }
    return archiveResult(
      ARCHIVE_CODES.DATABASE_ERROR,
      "Die Archivierung ist fehlgeschlagen. Alle bisherigen Aenderungen wurden zurueckgerollt.",
    );
  }
}
