import { WEEKDAY_OPTIONS } from "./trainingOptions";

export function getWeekdayLabel(value) {
  return (
    WEEKDAY_OPTIONS.find((item) => item.value === Number(value))?.label ||
    "Wochentag"
  );
}

export function toTimeValue(value) {
  if (!value) return "";
  return String(value).slice(0, 5);
}

export function toDateValue(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

export function sortTrainingTimes(trainingTimes = []) {
  return [...trainingTimes].sort((left, right) => {
    const weekdayDelta =
      Number(left?.weekday || 0) - Number(right?.weekday || 0);
    if (weekdayDelta !== 0) return weekdayDelta;

    const leftTime = toTimeValue(left?.start_time);
    const rightTime = toTimeValue(right?.start_time);
    return leftTime.localeCompare(rightTime);
  });
}

export function formatTimeRange(startTime, endTime) {
  const start = toTimeValue(startTime);
  const end = toTimeValue(endTime);

  if (start && end) return `${start}–${end} Uhr`;
  if (start) return `${start} Uhr`;
  return "Uhrzeit offen";
}

export function buildSuccessMessage(createdItems = []) {
  if (createdItems.length <= 1) {
    const item = createdItems[0];
    return item
      ? `Trainingszeit hinzugefügt: ${getWeekdayLabel(item.weekday)}, ${formatTimeRange(item.start_time, item.end_time)}`
      : null;
  }

  const weekdays = createdItems
    .map((item) => getWeekdayLabel(item.weekday))
    .join(", ");
  return `Trainingszeiten hinzugefügt: ${weekdays}`;
}
