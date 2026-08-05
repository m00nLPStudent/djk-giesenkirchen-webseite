import { supabase } from "@/lib/supabase";

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
