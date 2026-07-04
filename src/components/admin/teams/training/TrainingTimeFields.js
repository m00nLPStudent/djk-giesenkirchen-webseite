import {
  InputField,
  SelectField,
  StatusSwitch,
  TextareaField,
} from "@/components/admin/forms";
import { TRAINING_TYPE_OPTIONS, WEEKDAY_OPTIONS } from "./trainingOptions";
import { toDateValue, toTimeValue } from "./trainingFormatters";

export default function TrainingTimeFields({ item, onFieldChange, onPersist }) {
  return (
    <>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <SelectField
          label="Wochentag"
          value={item.weekday ?? 1}
          onChange={(event) => {
            const nextValue = Number(event.target.value || 1);
            onFieldChange("weekday", nextValue);
            void onPersist({ ...item, weekday: nextValue });
          }}
        >
          {WEEKDAY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Trainingsart"
          value={item.training_type || "training"}
          onChange={(event) => {
            const nextValue = event.target.value;
            onFieldChange("training_type", nextValue);
            void onPersist({ ...item, training_type: nextValue });
          }}
        >
          {TRAINING_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>

        <InputField
          label="Beginn"
          type="time"
          value={toTimeValue(item.start_time)}
          onChange={(event) => onFieldChange("start_time", event.target.value)}
          onBlur={(event) =>
            void onPersist({
              ...item,
              start_time: event.target.value,
            })
          }
        />

        <InputField
          label="Ende"
          type="time"
          value={toTimeValue(item.end_time)}
          onChange={(event) => onFieldChange("end_time", event.target.value)}
          onBlur={(event) =>
            void onPersist({
              ...item,
              end_time: event.target.value,
            })
          }
        />

        <InputField
          label="Sportanlage"
          value={item.location_name || ""}
          onChange={(event) =>
            onFieldChange("location_name", event.target.value)
          }
          onBlur={(event) =>
            void onPersist({
              ...item,
              location_name: event.target.value,
            })
          }
        />

        <InputField
          label="Ort"
          value={item.location_city || ""}
          onChange={(event) =>
            onFieldChange("location_city", event.target.value)
          }
          onBlur={(event) =>
            void onPersist({
              ...item,
              location_city: event.target.value,
            })
          }
        />

        <InputField
          label="Straße"
          value={item.location_address || ""}
          onChange={(event) =>
            onFieldChange("location_address", event.target.value)
          }
          onBlur={(event) =>
            void onPersist({
              ...item,
              location_address: event.target.value,
            })
          }
        />

        <InputField
          label="Gültig von"
          type="date"
          value={toDateValue(item.effective_from)}
          onChange={(event) =>
            onFieldChange("effective_from", event.target.value)
          }
          onBlur={(event) =>
            void onPersist({
              ...item,
              effective_from: event.target.value,
            })
          }
        />

        <InputField
          label="Gültig bis"
          type="date"
          value={toDateValue(item.effective_until)}
          onChange={(event) =>
            onFieldChange("effective_until", event.target.value)
          }
          onBlur={(event) =>
            void onPersist({
              ...item,
              effective_until: event.target.value,
            })
          }
        />
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
          description="Steuert, ob diese Trainingszeit bei der automatischen Terminberechnung berücksichtigt wird."
        />
      </div>
    </>
  );
}
