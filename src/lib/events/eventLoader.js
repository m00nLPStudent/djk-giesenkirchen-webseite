import { supabase } from "../supabase";
import { addDays, dateToKeyLocal, parseDateOnlyLocal } from "./dateHelpers";
import { applyClubClosurePeriods } from "./closurePeriods";
import { applyTrainingExceptions } from "./trainingExceptions";
import { getTrainingOccurrences } from "./virtualTraining";

function toErrorMessage(error, fallback) {
  if (error?.message) return error.message;
  return fallback;
}

export async function getVirtualTrainingEvents({
  from,
  to,
  maxOccurrencesPerTraining,
} = {}) {
  const now = new Date();
  const fromDate = parseDateOnlyLocal(from || now) || parseDateOnlyLocal(now);
  const toDate =
    parseDateOnlyLocal(to || addDays(now, 365)) ||
    parseDateOnlyLocal(addDays(now, 365));
  const fromKey = dateToKeyLocal(fromDate);
  const toKey = dateToKeyLocal(toDate);

  const [trainingTimesResult, exceptionsResult, closuresResult] =
    await Promise.all([
      supabase.from("team_training_times").select("*"),
      supabase
        .from("team_training_exceptions")
        .select("*")
        .gte("exception_date", fromKey)
        .lte("exception_date", toKey),
      supabase
        .from("club_closure_periods")
        .select("*")
        .lte("starts_on", toKey)
        .gte("ends_on", fromKey),
    ]);

  if (trainingTimesResult.error) {
    throw new Error(
      toErrorMessage(
        trainingTimesResult.error,
        "Fehler beim Laden von team_training_times.",
      ),
    );
  }

  if (exceptionsResult.error) {
    throw new Error(
      toErrorMessage(
        exceptionsResult.error,
        "Fehler beim Laden von team_training_exceptions.",
      ),
    );
  }

  if (closuresResult.error) {
    throw new Error(
      toErrorMessage(
        closuresResult.error,
        "Fehler beim Laden von club_closure_periods.",
      ),
    );
  }

  const trainingTimes = trainingTimesResult.data || [];
  const exceptions = exceptionsResult.data || [];
  const closurePeriods = closuresResult.data || [];

  const teamSeasonIds = [
    ...new Set(
      trainingTimes.map((item) => item?.team_season_id).filter(Boolean),
    ),
  ];
  const seasonMap = new Map();
  const teamMap = new Map();

  if (teamSeasonIds.length > 0) {
    const seasonsResult = await supabase
      .from("team_seasons")
      .select("id, team_id, name_de, slug")
      .in("id", teamSeasonIds);

    if (seasonsResult.error) {
      throw new Error(
        toErrorMessage(
          seasonsResult.error,
          "Fehler beim Laden von team_seasons.",
        ),
      );
    }

    (seasonsResult.data || []).forEach((season) => {
      seasonMap.set(season.id, season);
    });

    const teamIds = [
      ...new Set(
        (seasonsResult.data || []).map((item) => item?.team_id).filter(Boolean),
      ),
    ];

    if (teamIds.length > 0) {
      const teamsResult = await supabase
        .from("teams")
        .select("id, name_de, slug")
        .in("id", teamIds);

      if (teamsResult.error) {
        throw new Error(
          toErrorMessage(teamsResult.error, "Fehler beim Laden von teams."),
        );
      }

      (teamsResult.data || []).forEach((team) => {
        teamMap.set(team.id, team);
      });
    }
  }

  const trainingTimesWithRelations = trainingTimes.map((slot) => {
    const season = seasonMap.get(slot.team_season_id) || null;
    const team = season ? teamMap.get(season.team_id) || null : null;

    return {
      ...slot,
      team_seasons: season,
      teams: team,
      team_name_de: slot.team_name_de || team?.name_de || null,
      team_slug: slot.team_slug || team?.slug || null,
    };
  });

  const occurrences = getTrainingOccurrences(trainingTimesWithRelations, {
    from: fromDate,
    to: toDate,
    maxOccurrencesPerTraining,
  });
  const withExceptions = applyTrainingExceptions(occurrences, exceptions);

  return applyClubClosurePeriods(withExceptions, closurePeriods);
}
