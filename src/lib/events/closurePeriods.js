import { isDateWithinRange, parseDateOnlyLocal } from "./dateHelpers";

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
