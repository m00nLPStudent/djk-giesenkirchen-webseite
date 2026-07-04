import {
  InputField,
  SelectField,
  StatusSwitch,
  TextareaField,
} from "@/components/admin/forms";
import { TRAINING_TYPE_OPTIONS, WEEKDAY_OPTIONS } from "./trainingOptions";
import { toDateValue, toTimeValue } from "./trainingFormatters";

export default function TrainingTimesCreatePanel({
  draft,
  selectedWeekdays,
  isOpen,
  onToggleOpen,
  onToggleWeekday,
  onUpdateDraft,
}) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <button
        type="button"
        onClick={onToggleOpen}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <div>
          <p className="text-lg font-black text-white">Neue Trainingszeit</p>
          <p className="mt-1 text-sm text-white/50">
            Wähle mehrere Wochentage aus. Beim Speichern wird pro Tag
            automatisch ein eigener Datensatz angelegt.
          </p>
        </div>

        <span className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/65">
          {isOpen ? "Zuklappen" : "Aufklappen"}
        </span>
      </button>

      {isOpen && (
        <>
          <div className="mt-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-white/50">
              Wochentage
            </p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {WEEKDAY_OPTIONS.map((option) => {
                const isSelected = selectedWeekdays.includes(option.value);

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onToggleWeekday(option.value)}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold transition ${
                      isSelected
                        ? "border-red-500 bg-red-500/10 text-white"
                        : "border-white/10 bg-black/20 text-white/70 hover:border-red-500 hover:text-white"
                    }`}
                  >
                    <span className="inline-flex items-center gap-3">
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-md border text-xs ${
                          isSelected
                            ? "border-red-500 bg-red-600 text-white"
                            : "border-white/20"
                        }`}
                      >
                        {isSelected ? "✓" : ""}
                      </span>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <InputField
              label="Beginn"
              type="time"
              value={toTimeValue(draft.start_time)}
              onChange={(event) =>
                onUpdateDraft("start_time", event.target.value)
              }
            />

            <InputField
              label="Ende"
              type="time"
              value={toTimeValue(draft.end_time)}
              onChange={(event) =>
                onUpdateDraft("end_time", event.target.value)
              }
            />

            <SelectField
              label="Trainingsart"
              value={draft.training_type || "training"}
              onChange={(event) =>
                onUpdateDraft("training_type", event.target.value)
              }
            >
              {TRAINING_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectField>

            <InputField
              label="Sportanlage"
              value={draft.location_name || ""}
              onChange={(event) =>
                onUpdateDraft("location_name", event.target.value)
              }
            />

            <InputField
              label="Straße"
              value={draft.location_address || ""}
              onChange={(event) =>
                onUpdateDraft("location_address", event.target.value)
              }
            />

            <InputField
              label="PLZ / Ort"
              value={draft.location_city || ""}
              onChange={(event) =>
                onUpdateDraft("location_city", event.target.value)
              }
            />

            <InputField
              label="Gültig von"
              type="date"
              value={toDateValue(draft.effective_from)}
              onChange={(event) =>
                onUpdateDraft("effective_from", event.target.value)
              }
            />

            <InputField
              label="Gültig bis"
              type="date"
              value={toDateValue(draft.effective_until)}
              onChange={(event) =>
                onUpdateDraft("effective_until", event.target.value)
              }
            />
          </div>

          <div className="mt-5">
            <TextareaField
              label="Bemerkung"
              rows={3}
              value={draft.note || ""}
              onChange={(event) => onUpdateDraft("note", event.target.value)}
            />
          </div>

          <div className="mt-5">
            <StatusSwitch
              checked={Boolean(draft.is_active)}
              onChange={(nextValue) => onUpdateDraft("is_active", nextValue)}
              activeLabel="Aktiv"
              inactiveLabel="Inaktiv"
              description="Diese Einstellung wird für alle neu angelegten Wochentage übernommen."
            />
          </div>
        </>
      )}
    </div>
  );
}
