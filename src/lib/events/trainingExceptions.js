import {
  addHours,
  combineDateAndTimeLocal,
  dateToKeyLocal,
  parseDateOnlyLocal,
} from "./dateHelpers";
import { getTrainingTypeLabel } from "./eventFormatter";

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
