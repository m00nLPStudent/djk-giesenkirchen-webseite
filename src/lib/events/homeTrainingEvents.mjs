export const HOME_TRAINING_LIMIT = 10;

export function selectUpcomingHomeTrainings(
  events = [],
  { now = new Date(), limit = HOME_TRAINING_LIMIT } = {},
) {
  const nowTime = now instanceof Date ? now.getTime() : new Date(now).getTime();
  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : HOME_TRAINING_LIMIT;

  return events
    .filter(
      (event) =>
        event?.is_virtual === true &&
        ["team_training", "department_training"].includes(event?.source_type) &&
        Number.isFinite(new Date(event.starts_at).getTime()) &&
        new Date(event.starts_at).getTime() >= nowTime,
    )
    .sort(
      (left, right) =>
        new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime(),
    )
    .slice(0, safeLimit);
}
