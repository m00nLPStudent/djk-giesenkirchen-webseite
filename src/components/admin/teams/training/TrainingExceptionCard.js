import { EXCEPTION_TYPE_OPTIONS } from "./trainingExceptionOptions";
import {
  getTrainingTimeLabel,
  toDateValue,
} from "./trainingExceptionFormatters";
import TrainingExceptionFields from "./TrainingExceptionFields";

export default function TrainingExceptionCard({
  item,
  trainingTime,
  trainingTimes,
  onDelete,
  onFieldChange,
  onPersist,
}) {
  const exceptionTypeLabel =
    EXCEPTION_TYPE_OPTIONS.find(
      (option) => option.value === item.exception_type,
    )?.label || "Ausnahme";

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-lg font-black text-white">
            {toDateValue(item.exception_date) || "Ohne Datum"}
          </p>
          <p className="mt-1 text-sm text-white/45">
            {exceptionTypeLabel}
            {trainingTime ? ` · ${getTrainingTimeLabel(trainingTime)}` : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={onDelete}
          className="rounded-full border border-red-500/40 px-4 py-2 text-sm font-bold text-red-400 transition hover:bg-red-500/10"
        >
          Löschen
        </button>
      </div>

      <TrainingExceptionFields
        item={item}
        trainingTimes={trainingTimes}
        onFieldChange={onFieldChange}
        onPersist={onPersist}
      />
    </div>
  );
}
