import TrainingTimeFields from "./TrainingTimeFields";
import { TRAINING_TYPE_OPTIONS } from "./trainingOptions";
import { getWeekdayLabel, toTimeValue } from "./trainingFormatters";

export default function TrainingTimeCard({
  item,
  isHighlighted,
  isOpen,
  itemRef,
  onToggleOpen,
  onDelete,
  onFieldChange,
  onPersist,
}) {
  const summary = `${getWeekdayLabel(item.weekday)} · ${toTimeValue(item.start_time)}-${toTimeValue(item.end_time)}`;

  return (
    <div
      ref={itemRef}
      className={`rounded-[1.75rem] border bg-white/5 p-6 transition ${
        isHighlighted ? "border-red-500/70 bg-red-500/10" : "border-white/10"
      }`}
    >
      <button
        type="button"
        onClick={onToggleOpen}
        className="flex w-full items-start justify-between gap-4 text-left"
      >
        <div className="min-w-0">
          <p className="text-lg font-black text-white">{summary}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/50">
            <span>
              {TRAINING_TYPE_OPTIONS.find(
                (option) => option.value === item.training_type,
              )?.label || "Training"}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.16em] ${
                item.is_active
                  ? "bg-green-500/15 text-green-300"
                  : "bg-yellow-500/15 text-yellow-300"
              }`}
            >
              {item.is_active ? "Aktiv" : "Inaktiv"}
            </span>
          </div>
        </div>

        <span className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/65">
          {isOpen ? "Zuklappen" : "Bearbeiten"}
        </span>
      </button>

      {isOpen && (
        <>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onDelete}
              className="rounded-full border border-red-500/40 px-4 py-2 text-sm font-bold text-red-400 transition hover:bg-red-500/10"
            >
              Löschen
            </button>
          </div>

          <TrainingTimeFields
            item={item}
            onFieldChange={onFieldChange}
            onPersist={onPersist}
          />
        </>
      )}
    </div>
  );
}
