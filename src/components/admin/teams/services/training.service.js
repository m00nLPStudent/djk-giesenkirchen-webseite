import { supabase } from "@/lib/supabase";

function normalizeTrainingTimePayload(payload = {}) {
  return {
    team_season_id: payload.team_season_id || null,
    weekday: Number(payload.weekday || 1),
    start_time: payload.start_time || null,
    end_time: payload.end_time || null,
    training_type: payload.training_type || "training",
    location_name: payload.location_name || null,
    location_address: payload.location_address || null,
    location_city: payload.location_city || null,
    is_active: payload.is_active ?? true,
    effective_from: payload.effective_from || null,
    effective_until: payload.effective_until || null,
    note: payload.note || null,
  };
}

function normalizeTrainingExceptionPayload(payload = {}) {
  return {
    team_training_time_id: payload.team_training_time_id || null,
    exception_date: payload.exception_date || null,
    exception_type: payload.exception_type || "cancelled",
    override_start_time: payload.override_start_time || null,
    override_end_time: payload.override_end_time || null,
    override_location_name: payload.override_location_name || null,
    override_location_address: payload.override_location_address || null,
    override_location_city: payload.override_location_city || null,
    note: payload.note || null,
    is_active: payload.is_active ?? true,
  };
}

export async function getTrainingTimes({
  teamSeasonId,
  includeInactive = true,
} = {}) {
  let query = supabase
    .from("team_training_times")
    .select("*")
    .order("weekday", { ascending: true })
    .order("start_time", { ascending: true });

  if (teamSeasonId) {
    query = query.eq("team_season_id", teamSeasonId);
  }

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  return await query;
}

export async function createTrainingTime(payload) {
  if (Array.isArray(payload)) {
    return await supabase
      .from("team_training_times")
      .insert(payload.map((item) => normalizeTrainingTimePayload(item)))
      .select("*");
  }

  return await supabase
    .from("team_training_times")
    .insert(normalizeTrainingTimePayload(payload))
    .select("*")
    .single();
}

export async function updateTrainingTime(id, payload) {
  return await supabase
    .from("team_training_times")
    .update(normalizeTrainingTimePayload(payload))
    .eq("id", id)
    .select("*")
    .single();
}

export async function deleteTrainingTime(id) {
  return await supabase.from("team_training_times").delete().eq("id", id);
}

export async function getTrainingExceptions({
  teamSeasonId,
  teamTrainingTimeId,
  teamTrainingTimeIds,
  includeInactive = true,
} = {}) {
  let ids = teamTrainingTimeIds;

  if (!ids && teamSeasonId) {
    const trainingTimesResult = await getTrainingTimes({
      teamSeasonId,
      includeInactive: true,
    });
    if (trainingTimesResult.error) {
      return { data: null, error: trainingTimesResult.error };
    }

    ids = (trainingTimesResult.data || []).map((item) => item.id);
  }

  let query = supabase
    .from("team_training_exceptions")
    .select("*")
    .order("exception_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (teamTrainingTimeId) {
    query = query.eq("team_training_time_id", teamTrainingTimeId);
  } else if (Array.isArray(ids)) {
    if (!ids.length) return { data: [], error: null };
    query = query.in("team_training_time_id", ids);
  }

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  return await query;
}

export async function createTrainingException(payload) {
  return await supabase
    .from("team_training_exceptions")
    .insert(normalizeTrainingExceptionPayload(payload))
    .select("*")
    .single();
}

export async function updateTrainingException(id, payload) {
  return await supabase
    .from("team_training_exceptions")
    .update(normalizeTrainingExceptionPayload(payload))
    .eq("id", id)
    .select("*")
    .single();
}

export async function deleteTrainingException(id) {
  return await supabase.from("team_training_exceptions").delete().eq("id", id);
}
