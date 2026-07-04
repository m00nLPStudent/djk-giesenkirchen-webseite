import {
  InputField,
  SelectField,
  StatusSwitch,
  TextareaField,
} from "@/components/admin/forms";
import {
  EXCEPTION_TYPE_OPTIONS,
  TRAINING_TYPE_OVERRIDE_OPTIONS,
} from "./trainingExceptionOptions";
import {
  toDateValue,
  toTimeValue,
  getTrainingTimeLabel,
} from "./trainingExceptionFormatters";

export default function TrainingExceptionFields({
  item,
  trainingTimes,
  onFieldChange,
  onPersist,
}) {
  return (
    <>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <SelectField
          label="Trainingszeit"
          value={item.team_training_time_id || ""}
          onChange={(event) => {
            const nextValue = event.target.value;
            onFieldChange("team_training_time_id", nextValue);
            void onPersist({ ...item, team_training_time_id: nextValue });
          }}
        >
          {trainingTimes.map((trainingTimeItem) => (
            <option key={trainingTimeItem.id} value={trainingTimeItem.id}>
              {getTrainingTimeLabel(trainingTimeItem)}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Typ"
          value={item.exception_type || "cancelled"}
          onChange={(event) => {
            const nextValue = event.target.value;
            onFieldChange("exception_type", nextValue);
            void onPersist({ ...item, exception_type: nextValue });
          }}
        >
          {EXCEPTION_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>

        <InputField
          label="Datum"
          type="date"
          value={toDateValue(item.exception_date)}
          onChange={(event) =>
            onFieldChange("exception_date", event.target.value)
          }
          onBlur={(event) =>
            void onPersist({
              ...item,
              exception_date: event.target.value,
            })
          }
        />

        <SelectField
          label="Neue Trainingsart (optional)"
          value={item.override_training_type || ""}
          onChange={(event) => {
            const nextValue = event.target.value;
            onFieldChange("override_training_type", nextValue);
            void onPersist({ ...item, override_training_type: nextValue });
          }}
        >
          {TRAINING_TYPE_OVERRIDE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>

        {item.exception_type === "moved" && (
          <>
            <InputField
              label="Neue Uhrzeit von (optional)"
              type="time"
              value={toTimeValue(item.override_start_time)}
              onChange={(event) =>
                onFieldChange("override_start_time", event.target.value)
              }
              onBlur={(event) =>
                void onPersist({
                  ...item,
                  override_start_time: event.target.value,
                })
              }
            />

            <InputField
              label="Neue Uhrzeit bis (optional)"
              type="time"
              value={toTimeValue(item.override_end_time)}
              onChange={(event) =>
                onFieldChange("override_end_time", event.target.value)
              }
              onBlur={(event) =>
                void onPersist({
                  ...item,
                  override_end_time: event.target.value,
                })
              }
            />

            <InputField
              label="Neuer Ort (optional)"
              value={item.override_location_city || ""}
              onChange={(event) =>
                onFieldChange("override_location_city", event.target.value)
              }
              onBlur={(event) =>
                void onPersist({
                  ...item,
                  override_location_city: event.target.value,
                })
              }
            />

            <InputField
              label="Neue Sportanlage (optional)"
              value={item.override_location_name || ""}
              onChange={(event) =>
                onFieldChange("override_location_name", event.target.value)
              }
              onBlur={(event) =>
                void onPersist({
                  ...item,
                  override_location_name: event.target.value,
                })
              }
            />

            <InputField
              label="Neue Straße (optional)"
              value={item.override_location_address || ""}
              onChange={(event) =>
                onFieldChange("override_location_address", event.target.value)
              }
              onBlur={(event) =>
                void onPersist({
                  ...item,
                  override_location_address: event.target.value,
                })
              }
            />
          </>
        )}
      </div>

      <div className="mt-5">
        <TextareaField
          label="Bemerkung"
          rows={3}
          value={item.note || ""}
          onChange={(event) => onFieldChange("note", event.target.value)}
          onBlur={(event) =>
            void onPersist({
              ...item,
              note: event.target.value,
            })
          }
        />
      </div>

      <div className="mt-5">
        <StatusSwitch
          checked={Boolean(item.is_active)}
          onChange={(nextValue) => {
            onFieldChange("is_active", nextValue);
            void onPersist({ ...item, is_active: nextValue });
          }}
          activeLabel="Aktiv"
          inactiveLabel="Inaktiv"
          description="Steuert, ob diese Ausnahme in der Terminberechnung berücksichtigt wird."
        />
      </div>
    </>
  );
}
