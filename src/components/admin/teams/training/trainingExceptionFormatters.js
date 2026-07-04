import { toDateValue, toTimeValue } from "./trainingFormatters";

export { toDateValue, toTimeValue };

export function getTrainingTimeLabel(item = {}) {
  const weekdayMap = {
    1: "Mo",
    2: "Di",
    3: "Mi",
    4: "Do",
    5: "Fr",
    6: "Sa",
    7: "So",
  };

  return `${weekdayMap[item.weekday] || "Tag"} · ${toTimeValue(item.start_time)}-${toTimeValue(item.end_time)}`;
}
