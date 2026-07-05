import {
  addDays,
  addHours,
  combineDateAndTimeLocal,
  dateToKeyLocal,
  getNextDateForIsoWeekday,
  maxDate,
  minDate,
  parseDateOnlyLocal,
  parseTimeParts,
} from "./dateHelpers";
import { getTrainingTypeLabel } from "./eventFormatter";

function getTeamNameFromTraining(slot = {}) {
  return (
    slot.team_name_de ||
    slot.team_seasons?.name_de ||
    slot.team_season?.name_de ||
    slot.teams?.name_de ||
    slot.team?.name_de ||
    "Mannschaft"
  );
}

function getTeamIdFromTraining(slot = {}) {
  return (
    slot.team_id ||
    slot.team_seasons?.team_id ||
    slot.team_season?.team_id ||
    slot.teams?.id ||
    slot.team?.id ||
    null
  );
}

function getTeamSlugFromTraining(slot = {}) {
  return (
    slot.team_slug ||
    slot.team_seasons?.team_slug ||
    slot.team_season?.team_slug ||
    slot.teams?.slug ||
    slot.team?.slug ||
    null
  );
}

function getTeamSeasonSlugFromTraining(slot = {}) {
  return slot.team_seasons?.slug || slot.team_season?.slug || null;
}

function toOccurrenceLikeEvent(slot, startDate, endDate, occurrenceIndex) {
  const trainingType = slot.training_type || "training";
  const teamName = getTeamNameFromTraining(slot);
  const teamId = getTeamIdFromTraining(slot);
  const teamSlug = getTeamSlugFromTraining(slot);
  const teamSeasonSlug = getTeamSeasonSlugFromTraining(slot);
  const dateKey = dateToKeyLocal(startDate);
  const baseId = `team-training-${slot.id}`;

  return {
    id: baseId,
    occurrence_id: `${baseId}-${dateKey}-${occurrenceIndex}`,
    occurrence_index: occurrenceIndex,
    base_event_id: baseId,
    is_recurring_instance: true,

    is_virtual: true,
    source_type: "team_training",

    team_id: teamId,
    team_season_id: slot.team_season_id || null,
    team_slug: teamSlug,
    team_season_slug: teamSeasonSlug,
    team_name_de: teamName,
    training_type: trainingType,

    title_de: `${getTrainingTypeLabel(trainingType)} ${teamName}`,
    teaser_de: `${teamName} · ${getTrainingTypeLabel(trainingType)}`,
    description_de: slot.note || null,

    starts_at: startDate.toISOString(),
    ends_at: endDate.toISOString(),

    location_name: slot.location_name || null,
    location_address: slot.location_address || null,
    location_city: slot.location_city || null,

    is_all_day: false,
    event_type: "training",
  };
}

export function getTrainingOccurrences(
  trainingTimes = [],
  { from, to, maxOccurrencesPerTraining = 180 } = {},
) {
  const now = new Date();
  const fromDate = parseDateOnlyLocal(from || now) || parseDateOnlyLocal(now);
  const toDate =
    parseDateOnlyLocal(to || addDays(now, 365)) ||
    parseDateOnlyLocal(addDays(now, 365));
  const occurrences = [];

  trainingTimes.forEach((slot) => {
    if (!slot?.id) return;
    if (slot.is_active === false) return;

    const isoWeekday = Number(slot.weekday);
    if (!Number.isFinite(isoWeekday) || isoWeekday < 1 || isoWeekday > 7)
      return;

    const slotStartParts = parseTimeParts(slot.start_time);
    const slotEndParts = parseTimeParts(slot.end_time);
    if (!slotStartParts || !slotEndParts) return;

    const effectiveFrom = parseDateOnlyLocal(slot.effective_from);
    const effectiveUntil = parseDateOnlyLocal(slot.effective_until);

    const iterationStart = effectiveFrom
      ? maxDate(fromDate, effectiveFrom)
      : fromDate;
    const iterationEnd = effectiveUntil
      ? minDate(toDate, effectiveUntil)
      : toDate;
    if (iterationEnd < iterationStart) return;

    let currentDate = getNextDateForIsoWeekday(iterationStart, isoWeekday);
    let occurrenceIndex = 1;
    let added = 0;

    while (currentDate <= iterationEnd && added < maxOccurrencesPerTraining) {
      const startsAt = combineDateAndTimeLocal(currentDate, slot.start_time);
      const endsAt = combineDateAndTimeLocal(currentDate, slot.end_time);
      if (!startsAt || !endsAt) break;

      let endValue = endsAt;
      if (endValue <= startsAt) {
        endValue = addHours(startsAt, 2);
      }

      occurrences.push(
        toOccurrenceLikeEvent(slot, startsAt, endValue, occurrenceIndex),
      );

      currentDate = addDays(currentDate, 7);
      occurrenceIndex += 1;
      added += 1;
    }
  });

  occurrences.sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  );

  return occurrences;
}

export function mergeEventsWithVirtualTrainings(
  events = [],
  virtualTrainings = [],
) {
  const merged = [...events, ...virtualTrainings];

  merged.sort((a, b) => {
    const left = new Date(a?.starts_at || 0).getTime();
    const right = new Date(b?.starts_at || 0).getTime();
    return left - right;
  });

  return merged;
}
