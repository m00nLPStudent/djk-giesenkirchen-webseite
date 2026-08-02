import {
  CONTRIBUTION_PAYMENT_READ_FIELDS,
  CONTRIBUTION_READ_FIELDS,
} from "../core/contributionConstants.js";
import {
  createContributionDetailDto,
  createContributionReadDto,
} from "../dto/contributionReadDto.js";
import { parseEuroCents } from "../core/money.js";

async function loadPlayersByIds(db, playerIds = []) {
  if (!playerIds.length) return new Map();
  const { data, error } = await db
    .from("players")
    .select("id, first_name, last_name")
    .in("id", playerIds);

  if (error) throw new Error(`players query failed: ${error.message}`);
  return new Map((data || []).map((player) => [player.id, player]));
}

async function loadSeasonsByIds(db, seasonIds = []) {
  if (!seasonIds.length) return new Map();
  const { data, error } = await db.from("seasons").select("id, name").in("id", seasonIds);
  if (error) throw new Error(`seasons query failed: ${error.message}`);
  return new Map((data || []).map((season) => [season.id, season]));
}

async function loadPaymentsByContributionIds(db, contributionIds = []) {
  if (!contributionIds.length) return new Map();
  const { data, error } = await db
    .from("player_contribution_payments")
    .select(CONTRIBUTION_PAYMENT_READ_FIELDS)
    .in("contribution_id", contributionIds)
    .order("paid_at", { ascending: false });

  if (error) throw new Error(`player_contribution_payments query failed: ${error.message}`);

  return (data || []).reduce((map, payment) => {
    const list = map.get(payment.contribution_id) || [];
    list.push(payment);
    map.set(payment.contribution_id, list);
    return map;
  }, new Map());
}

async function loadSearchPlayerIds(db, search = "") {
  const normalized = String(search || "").trim();
  if (!normalized) return null;

  const { data, error } = await db
    .from("players")
    .select("id")
    .or(`first_name.ilike.%${normalized}%,last_name.ilike.%${normalized}%`);

  if (error) throw new Error(`players search query failed: ${error.message}`);
  return (data || []).map((player) => player.id).filter(Boolean);
}

async function loadContributionRows(db, filters = {}) {
  const matchingPlayerIds = await loadSearchPlayerIds(db, filters.search);
  if (matchingPlayerIds && !matchingPlayerIds.length) return [];

  let query = db.from("player_contributions").select(CONTRIBUTION_READ_FIELDS);

  if (filters.id) query = query.eq("id", filters.id);
  if (filters.seasonId) query = query.eq("season_id", filters.seasonId);
  if (filters.playerId) query = query.eq("player_id", filters.playerId);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.contributionKey) {
    query = query.eq("contribution_key", filters.contributionKey);
  }
  if (filters.teamSnapshotName) {
    query = query.ilike("team_snapshot_name", `%${String(filters.teamSnapshotName).trim()}%`);
  }
  if (filters.dueDate) query = query.eq("due_date", filters.dueDate);
  if (filters.overdue) query = query.lt("due_date", new Date().toISOString().slice(0, 10));
  if (matchingPlayerIds?.length) query = query.in("player_id", matchingPlayerIds);

  const { data, error } = await query
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`player_contributions query failed: ${error.message}`);
  return data || [];
}

async function enrichContributionRows(db, rows = []) {
  const playerIds = Array.from(new Set((rows || []).map((row) => row.player_id).filter(Boolean)));
  const seasonIds = Array.from(new Set((rows || []).map((row) => row.season_id).filter(Boolean)));
  const contributionIds = (rows || []).map((row) => row.id).filter(Boolean);

  const [playersById, seasonsById, paymentsByContributionId] = await Promise.all([
    loadPlayersByIds(db, playerIds),
    loadSeasonsByIds(db, seasonIds),
    loadPaymentsByContributionIds(db, contributionIds),
  ]);

  return (rows || []).map((row) => ({
    contribution: row,
    player: playersById.get(row.player_id) || null,
    season: seasonsById.get(row.season_id) || null,
    payments: paymentsByContributionId.get(row.id) || [],
  }));
}

export async function loadContributionById(db, contributionId) {
  const rows = await loadContributionRows(db, { id: contributionId });
  const enriched = await enrichContributionRows(db, rows);
  const target = enriched[0];

  return target
    ? createContributionDetailDto(target.contribution, target)
    : null;
}

export async function loadFilteredContributions(db, filters = {}) {
  const rows = await loadContributionRows(db, filters);
  const enriched = await enrichContributionRows(db, rows);
  return enriched.map((item) => createContributionReadDto(item.contribution, item));
}

export async function loadContributionsByPlayerId(db, playerId, filters = {}) {
  return loadFilteredContributions(db, { ...filters, playerId });
}

export async function loadContributionsBySeasonId(db, seasonId, filters = {}) {
  return loadFilteredContributions(db, { ...filters, seasonId });
}

export async function loadOpenContributions(db, filters = {}) {
  return loadFilteredContributions(db, { ...filters, status: "open" });
}

export async function loadOverdueContributions(db, filters = {}) {
  const contributions = await loadFilteredContributions(db, {
    ...filters,
    overdue: true,
  });
  return contributions.filter((item) => item.isOverdue);
}

export async function loadPartiallyPaidContributions(db, filters = {}) {
  return loadFilteredContributions(db, { ...filters, status: "partially_paid" });
}

export async function loadContributionPayments(db, contributionId) {
  const paymentsByContributionId = await loadPaymentsByContributionIds(db, [contributionId]);
  return (paymentsByContributionId.get(contributionId) || []).map((payment) => ({
    ...payment,
    amount_cents: parseEuroCents(payment.amount).cents,
  }));
}

export async function loadContributionPlayersForDto(db, playerIds = []) {
  return loadPlayersByIds(db, playerIds);
}

export async function loadContributionSeasonsForDto(db, seasonIds = []) {
  return loadSeasonsByIds(db, seasonIds);
}
