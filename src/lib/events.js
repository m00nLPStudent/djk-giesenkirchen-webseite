import { supabase } from "./supabase";

export const EVENT_TYPE_LABELS = {
  training: "Training",
  spiel: "Spiel",
  turnier: "Turnier",
  vereinstermin: "Vereinstermin",
  sonstiges: "Sonstiges",
};

export const EVENT_RECURRENCE_LABELS = {
  none: "Keine Wiederholung",
  daily: "Täglich",
  weekly: "Wöchentlich",
  monthly: "Monatlich",
  yearly: "Jährlich",
};

const RECURRENCE_STEP_LIMIT = 1000;

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function dateToKeyLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateOnlyLocal(value) {
  if (!value) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const text = String(value).trim();
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(year, month - 1, day);
}

function parseTimeParts(value) {
  if (!value) return null;
  const match = String(value)
    .trim()
    .match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);

  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] || 0);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  if (seconds < 0 || seconds > 59) return null;

  return { hours, minutes, seconds };
}

function combineDateAndTimeLocal(dateOnly, timeValue) {
  const parts = parseTimeParts(timeValue);
  if (!dateOnly || !parts) return null;

  return new Date(
    dateOnly.getFullYear(),
    dateOnly.getMonth(),
    dateOnly.getDate(),
    parts.hours,
    parts.minutes,
    parts.seconds,
    0,
  );
}

function getIsoWeekday(date) {
  const jsDay = date.getDay();
  return jsDay === 0 ? 7 : jsDay;
}

function getNextDateForIsoWeekday(baseDate, isoWeekday) {
  const current = getIsoWeekday(baseDate);
  const delta =
    isoWeekday >= current ? isoWeekday - current : 7 - (current - isoWeekday);
  return addDays(baseDate, delta);
}

function minDate(a, b) {
  return a.getTime() <= b.getTime() ? a : b;
}

function maxDate(a, b) {
  return a.getTime() >= b.getTime() ? a : b;
}

function isDateWithinRange(date, start, end) {
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}

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

function getTrainingTypeLabel(type = "training") {
  const map = {
    training: "Training",
    spiel: "Spiel",
    torwart: "Torwarttraining",
    foerdertraining: "Foerdertraining",
    athletik: "Athletik",
    hallentraining: "Hallentraining",
    sonstiges: "Termin",
  };

  return map[type] || "Training";
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

export function applyTrainingExceptions(occurrences = [], exceptions = []) {
  if (!exceptions.length) return occurrences;

  const exceptionMap = new Map();

  exceptions.forEach((item) => {
    if (!item?.team_training_time_id) return;
    if (item.is_active === false) return;

    const date = parseDateOnlyLocal(item.exception_date);
    if (!date) return;

    const key = `${item.team_training_time_id}::${dateToKeyLocal(date)}`;
    exceptionMap.set(key, item);
  });

  const adjusted = [];

  occurrences.forEach((occurrence) => {
    const baseId = occurrence.id || "";
    const trainingTimeId = baseId.replace(/^team-training-/, "");
    const startDate = new Date(occurrence.starts_at);
    if (Number.isNaN(startDate.getTime())) return;

    const key = `${trainingTimeId}::${dateToKeyLocal(startDate)}`;
    const exception = exceptionMap.get(key);

    if (!exception) {
      adjusted.push(occurrence);
      return;
    }

    if (exception.exception_type === "cancelled") {
      return;
    }

    if (exception.exception_type === "moved") {
      const dateOnly =
        parseDateOnlyLocal(exception.exception_date) ||
        parseDateOnlyLocal(startDate);

      const currentStartTime = `${String(startDate.getHours()).padStart(2, "0")}:${String(startDate.getMinutes()).padStart(2, "0")}:${String(startDate.getSeconds()).padStart(2, "0")}`;
      const currentEndDate = new Date(occurrence.ends_at);
      const currentEndTime = !Number.isNaN(currentEndDate.getTime())
        ? `${String(currentEndDate.getHours()).padStart(2, "0")}:${String(currentEndDate.getMinutes()).padStart(2, "0")}:${String(currentEndDate.getSeconds()).padStart(2, "0")}`
        : currentStartTime;

      const movedStart = combineDateAndTimeLocal(
        dateOnly,
        exception.override_start_time || currentStartTime,
      );
      const movedEnd = combineDateAndTimeLocal(
        dateOnly,
        exception.override_end_time || currentEndTime,
      );

      const safeStart = movedStart || startDate;
      const safeEnd =
        movedEnd && movedEnd > safeStart ? movedEnd : addHours(safeStart, 2);

      adjusted.push({
        ...occurrence,
        starts_at: safeStart.toISOString(),
        ends_at: safeEnd.toISOString(),
        training_type:
          exception.override_training_type || occurrence.training_type,
        title_de:
          exception.override_training_type && occurrence.team_id
            ? `${getTrainingTypeLabel(exception.override_training_type)} ${occurrence.title_de.replace(/^.*?\s/, "")}`
            : occurrence.title_de,
        location_name:
          exception.override_location_name || occurrence.location_name,
        location_address:
          exception.override_location_address || occurrence.location_address,
        location_city:
          exception.override_location_city || occurrence.location_city,
        description_de: exception.note || occurrence.description_de,
      });

      return;
    }

    adjusted.push(occurrence);
  });

  adjusted.sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  );

  return adjusted;
}

export function applyClubClosurePeriods(occurrences = [], closurePeriods = []) {
  if (!closurePeriods.length) return occurrences;

  const activeClosures = closurePeriods
    .filter((item) => item && item.is_active !== false)
    .map((item) => ({
      ...item,
      starts_on: parseDateOnlyLocal(item.starts_on),
      ends_on: parseDateOnlyLocal(item.ends_on),
    }))
    .filter(
      (item) =>
        item.starts_on && item.ends_on && item.ends_on >= item.starts_on,
    );

  if (!activeClosures.length) return occurrences;

  return occurrences.filter((occurrence) => {
    const date = parseDateOnlyLocal(occurrence.starts_at);
    if (!date) return false;

    const blocked = activeClosures.some((closure) => {
      const inRange = isDateWithinRange(
        date,
        closure.starts_on,
        closure.ends_on,
      );
      if (!inRange) return false;

      if (closure.applies_to_all === true) return true;
      if (!closure.team_season_id) return false;
      return closure.team_season_id === occurrence.team_season_id;
    });

    return !blocked;
  });
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

function addRecurrenceStep(date, type, interval) {
  const next = new Date(date.getTime());

  switch (type) {
    case "daily":
      return addDays(next, interval);
    case "weekly":
      return addDays(next, interval * 7);
    case "monthly":
      next.setUTCMonth(next.getUTCMonth() + interval);
      return next;
    case "yearly":
      next.setUTCFullYear(next.getUTCFullYear() + interval);
      return next;
    default:
      return next;
  }
}

function normalizeRecurrenceType(type) {
  if (!type || !EVENT_RECURRENCE_LABELS[type]) return "none";
  return type;
}

function normalizeRecurrenceInterval(value) {
  const parsed = Number(value || 1);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.floor(parsed));
}

function normalizeRecurrenceCount(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return null;
  return Math.floor(parsed);
}

function toValidDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function getBaseDurationMs(event) {
  if (event?.ends_at) {
    const start = toValidDate(event.starts_at);
    const end = toValidDate(event.ends_at);
    if (start && end && end > start) {
      return end.getTime() - start.getTime();
    }
  }

  if (event?.is_all_day) {
    return 24 * 60 * 60 * 1000;
  }

  return 2 * 60 * 60 * 1000;
}

export function isRecurringEvent(event = {}) {
  return normalizeRecurrenceType(event.recurrence_type) !== "none";
}

export function getRecurrenceUntilDate(event = {}) {
  return toValidDate(event.recurrence_until);
}

export function getNextOccurrence(event = {}, from = new Date()) {
  const type = normalizeRecurrenceType(event.recurrence_type);
  const start = toValidDate(event.starts_at);
  if (!start) return null;

  if (type === "none") {
    return start >= from ? start : null;
  }

  const interval = normalizeRecurrenceInterval(event.recurrence_interval);
  const until = getRecurrenceUntilDate(event);
  const maxCount = normalizeRecurrenceCount(event.recurrence_count);

  let occurrence = new Date(start.getTime());
  let occurrenceIndex = 1;

  for (let step = 0; step < RECURRENCE_STEP_LIMIT; step += 1) {
    if (maxCount && occurrenceIndex > maxCount) return null;
    if (until && occurrence > until) return null;
    if (occurrence >= from) return occurrence;

    occurrence = addRecurrenceStep(occurrence, type, interval);
    occurrenceIndex += 1;
  }

  return null;
}

export function expandRecurringEvents(
  events = [],
  { from, to, maxOccurrencesPerEvent = 120 } = {},
) {
  const now = new Date();
  const fromDate = from || addDays(now, -180);
  const toDate = to || addDays(now, 365);
  const expanded = [];

  events.forEach((item) => {
    const start = toValidDate(item?.starts_at);
    if (!start) return;

    const type = normalizeRecurrenceType(item.recurrence_type);
    const interval = normalizeRecurrenceInterval(item.recurrence_interval);
    const until = getRecurrenceUntilDate(item);
    const maxCount = normalizeRecurrenceCount(item.recurrence_count);
    const durationMs = getBaseDurationMs(item);

    let occurrence = new Date(start.getTime());
    let occurrenceIndex = 1;
    let addedCount = 0;

    for (let step = 0; step < RECURRENCE_STEP_LIMIT; step += 1) {
      if (maxCount && occurrenceIndex > maxCount) break;
      if (until && occurrence > until) break;

      if (occurrence > toDate) break;

      if (occurrence >= fromDate) {
        const occurrenceEnd = new Date(occurrence.getTime() + durationMs);

        expanded.push({
          ...item,
          starts_at: occurrence.toISOString(),
          ends_at: occurrenceEnd.toISOString(),
          occurrence_index: occurrenceIndex,
          occurrence_id: `${item.id}-${occurrenceIndex}`,
          base_event_id: item.id,
          is_recurring_instance: type !== "none",
        });

        addedCount += 1;
        if (addedCount >= maxOccurrencesPerEvent) break;
      }

      if (type === "none") break;

      occurrence = addRecurrenceStep(occurrence, type, interval);
      occurrenceIndex += 1;
    }
  });

  expanded.sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  );

  return expanded;
}

export function formatRecurrenceText(event = {}) {
  const type = normalizeRecurrenceType(event.recurrence_type);
  if (type === "none") return null;

  const interval = normalizeRecurrenceInterval(event.recurrence_interval);

  if (interval <= 1) {
    const texts = {
      daily: "Wiederholt sich täglich",
      weekly: "Wiederholt sich jede Woche",
      monthly: "Wiederholt sich jeden Monat",
      yearly: "Wiederholt sich jährlich",
    };
    return texts[type] || null;
  }

  const plural = {
    daily: "Tage",
    weekly: "Wochen",
    monthly: "Monate",
    yearly: "Jahre",
  };

  return `Wiederholt sich alle ${interval} ${plural[type] || "Intervalle"}`;
}

export function getEventTypeLabel(type) {
  return EVENT_TYPE_LABELS[type] || "Event";
}

export function getEventStatusKey(item, now = new Date()) {
  if (!item?.is_published) return "entwurf";
  if (item?.starts_at && new Date(item.starts_at) > now) return "geplant";
  return "veroeffentlicht";
}

export function formatEventDate(value, locale = "de-DE") {
  if (!value) return "Kein Datum";

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function formatEventTime(value, { isAllDay = false } = {}) {
  if (isAllDay) return "Ganztägig";
  if (!value) return "Uhrzeit offen";

  return new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function splitEventsByTimeline(events = [], now = new Date()) {
  const upcoming = [];
  const past = [];

  events.forEach((item) => {
    if (!item?.starts_at) {
      upcoming.push(item);
      return;
    }

    if (new Date(item.starts_at) >= now) {
      upcoming.push(item);
      return;
    }

    past.push(item);
  });

  return {
    upcoming,
    past,
  };
}
