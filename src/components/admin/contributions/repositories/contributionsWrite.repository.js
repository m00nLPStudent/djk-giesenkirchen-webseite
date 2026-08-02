import {
  CONTRIBUTION_PAYMENT_READ_FIELDS,
  CONTRIBUTION_READ_FIELDS,
} from "../core/contributionConstants.js";

function createRepositoryError(message, code = "DATABASE_ERROR") {
  return { message, code };
}

export async function loadContributionRecordById(db, contributionId) {
  const { data, error } = await db
    .from("player_contributions")
    .select(CONTRIBUTION_READ_FIELDS)
    .eq("id", contributionId)
    .maybeSingle();

  return {
    data: data || null,
    error: error ? createRepositoryError(error.message) : null,
  };
}

export async function loadPaymentRecordById(db, paymentId) {
  const { data, error } = await db
    .from("player_contribution_payments")
    .select(CONTRIBUTION_PAYMENT_READ_FIELDS)
    .eq("id", paymentId)
    .maybeSingle();

  return {
    data: data || null,
    error: error ? createRepositoryError(error.message) : null,
  };
}

export async function loadPlayerRecordById(db, playerId) {
  const { data, error } = await db
    .from("players")
    .select("id, first_name, last_name")
    .eq("id", playerId)
    .maybeSingle();

  return {
    data: data || null,
    error: error ? createRepositoryError(error.message) : null,
  };
}

export async function loadSeasonRecordById(db, seasonId) {
  const { data, error } = await db
    .from("seasons")
    .select("id, name")
    .eq("id", seasonId)
    .maybeSingle();

  return {
    data: data || null,
    error: error ? createRepositoryError(error.message) : null,
  };
}

export async function findDuplicateContribution(db, filters = {}) {
  let query = db
    .from("player_contributions")
    .select("id, contribution_key", { head: false })
    .eq("player_id", filters.playerId)
    .eq("season_id", filters.seasonId)
    .eq("contribution_key", filters.contributionKey)
    .neq("status", "canceled");

  if (filters.excludeId) {
    query = query.neq("id", filters.excludeId);
  }

  const { data, error } = await query.limit(1);
  return {
    data: Array.isArray(data) ? data[0] || null : null,
    error: error ? createRepositoryError(error.message) : null,
  };
}

export async function insertContribution(db, payload = {}) {
  const { data, error } = await db
    .from("player_contributions")
    .insert(payload)
    .select("id")
    .maybeSingle();

  return {
    data: data || null,
    error: error ? createRepositoryError(error.message, error.code) : null,
  };
}

export async function updateContributionRecord(db, contributionId, payload = {}) {
  const { data, error } = await db
    .from("player_contributions")
    .update(payload)
    .eq("id", contributionId)
    .select("id")
    .maybeSingle();

  return {
    data: data || null,
    error: error ? createRepositoryError(error.message, error.code) : null,
  };
}

export async function insertContributionPayment(db, payload = {}) {
  const { data, error } = await db
    .from("player_contribution_payments")
    .insert(payload)
    .select("id")
    .maybeSingle();

  return {
    data: data || null,
    error: error ? createRepositoryError(error.message, error.code) : null,
  };
}

export async function updateContributionPaymentRecord(db, paymentId, payload = {}) {
  const { data, error } = await db
    .from("player_contribution_payments")
    .update(payload)
    .eq("id", paymentId)
    .select("id")
    .maybeSingle();

  return {
    data: data || null,
    error: error ? createRepositoryError(error.message, error.code) : null,
  };
}
