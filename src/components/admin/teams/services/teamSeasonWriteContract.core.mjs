export function resolveTeamSeasonWriteContract({
  existingTeamSeasonId = null,
  canCreateTeamSeason = false,
} = {}) {
  if (existingTeamSeasonId) {
    return {
      ok: true,
      operation: "update",
      teamSeasonId: existingTeamSeasonId,
    };
  }

  if (!canCreateTeamSeason) {
    return {
      ok: false,
      operation: null,
      teamSeasonId: null,
      error: "Fehlende Berechtigung: teams.create ist für eine neue Mannschaftssaison erforderlich.",
    };
  }

  return { ok: true, operation: "insert", teamSeasonId: null };
}
