import "server-only";
import { parseEuroCents } from "@/components/admin/contributions/core/money";

const FIELDS = "id, player_id, season_id, status, due_date, deferred_until, amount_due, amount_paid, amount_waived, amount_outstanding";
export const CONTRIBUTION_REMINDER_BATCH_SIZE = 100;

function outstandingCents(row) {
  const stored = parseEuroCents(row.amount_outstanding, { allowZero: true });
  if (stored.ok) return Math.max(0, stored.cents);
  return Math.max(0, parseEuroCents(row.amount_due, { allowZero: true }).cents
    - parseEuroCents(row.amount_paid, { allowZero: true }).cents
    - parseEuroCents(row.amount_waived, { allowZero: true }).cents);
}

export async function loadContributionReminderBatch(db, { afterId = null, limit = CONTRIBUTION_REMINDER_BATCH_SIZE } = {}) {
  let query = db.from("player_contributions").select(FIELDS)
    .in("status", ["open", "partially_paid", "deferred"])
    .order("id", { ascending: true }).limit(limit);
  if (afterId) query = query.gt("id", afterId);
  const result = await query;
  if (result.error) return { data: [], nextCursor: null, error: result.error };
  const rows = result.data || [];
  const playerIds = [...new Set(rows.map((row) => row.player_id).filter(Boolean))];
  const seasonIds = [...new Set(rows.map((row) => row.season_id).filter(Boolean))];
  const [players, teamSeasons] = await Promise.all([
    playerIds.length ? db.from("players").select("id, first_name, last_name").in("id", playerIds) : Promise.resolve({ data: [], error: null }),
    seasonIds.length ? db.from("team_seasons").select("id, season_id").in("season_id", seasonIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (players.error || teamSeasons.error) return { data: [], nextCursor: null, error: players.error || teamSeasons.error };
  const teamSeasonIds = (teamSeasons.data || []).map((row) => row.id);
  const assignments = playerIds.length && teamSeasonIds.length
    ? await db.from("player_team_seasons").select("player_id, team_season_id, is_active").in("player_id", playerIds).in("team_season_id", teamSeasonIds).eq("is_active", true)
    : { data: [], error: null };
  if (assignments.error) return { data: [], nextCursor: null, error: assignments.error };
  const playerById = new Map((players.data || []).map((row) => [row.id, row]));
  const seasonByTeam = new Map((teamSeasons.data || []).map((row) => [row.id, row.season_id]));
  const teamsByPlayerSeason = new Map();
  for (const row of assignments.data || []) {
    const key = `${row.player_id}:${seasonByTeam.get(row.team_season_id)}`;
    teamsByPlayerSeason.set(key, [...(teamsByPlayerSeason.get(key) || []), row.team_season_id]);
  }
  return {
    data: rows.map((row) => {
      const player = playerById.get(row.player_id) || {};
      return { id: row.id, playerId: row.player_id, seasonId: row.season_id, contributionYear: String(row.due_date || "").slice(0, 4), status: row.status, dueDate: row.due_date, deferredUntil: row.deferred_until, outstandingCents: outstandingCents(row), playerDisplayName: `${player.first_name || ""} ${player.last_name || ""}`.trim() || "Mitglied", teamSeasonIds: [...new Set(teamsByPlayerSeason.get(`${row.player_id}:${row.season_id}`) || [])] };
    }),
    nextCursor: rows.length === limit ? rows.at(-1)?.id || null : null,
    error: null,
  };
}
