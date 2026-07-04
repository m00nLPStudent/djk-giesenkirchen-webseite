import {
  FormGrid,
  FormSection,
  InputField,
  SelectField,
} from "@/components/admin/forms";
import { EVENT_TYPES, RECURRENCE_TYPES } from "../eventEditor.constants";

export default function EventTimeTab({
  form,
  teams,
  hasRecurrence,
  updateField,
}) {
  return (
    <FormSection
      eyebrow="Termin"
      title="Datum und Zeit"
      description="Lege Zeitraum, Tagesstatus und Typ des Events fest."
    >
      <FormGrid>
        <SelectField
          label="Typ"
          value={form.event_type}
          onChange={(eventValue) =>
            updateField("event_type", eventValue.target.value)
          }
        >
          {EVENT_TYPES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Mannschaft (optional)"
          value={form.team_id}
          onChange={(eventValue) =>
            updateField("team_id", eventValue.target.value)
          }
        >
          <option value="">Keine Mannschaft</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name_de}
            </option>
          ))}
        </SelectField>
      </FormGrid>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <InputField
          label="Start"
          type="datetime-local"
          required
          value={form.starts_at}
          onChange={(eventValue) =>
            updateField("starts_at", eventValue.target.value)
          }
        />
        <InputField
          label="Ende"
          type="datetime-local"
          value={form.ends_at}
          onChange={(eventValue) =>
            updateField("ends_at", eventValue.target.value)
          }
        />
      </div>

      <label className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70">
        <input
          type="checkbox"
          checked={form.is_all_day}
          onChange={(eventValue) =>
            updateField("is_all_day", eventValue.target.checked)
          }
        />
        Ganztägiger Termin
      </label>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">
          Wiederholung
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {RECURRENCE_TYPES.map(([value, label]) => (
            <label
              key={value}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-white/75"
            >
              <input
                type="radio"
                name="recurrence_type"
                value={value}
                checked={form.recurrence_type === value}
                onChange={(eventValue) =>
                  updateField("recurrence_type", eventValue.target.value)
                }
              />
              {label}
            </label>
          ))}
        </div>

        {hasRecurrence && (
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <InputField
              label="Intervall"
              type="number"
              min="1"
              value={form.recurrence_interval}
              onChange={(eventValue) =>
                updateField(
                  "recurrence_interval",
                  Math.max(1, Number(eventValue.target.value || 1)),
                )
              }
            />

            <InputField
              label="Enddatum der Serie"
              type="date"
              value={form.recurrence_until}
              onChange={(eventValue) =>
                updateField("recurrence_until", eventValue.target.value)
              }
            />

            <InputField
              label="Maximale Wiederholungen"
              type="number"
              min="1"
              value={form.recurrence_count}
              onChange={(eventValue) => {
                const next = eventValue.target.value;
                updateField(
                  "recurrence_count",
                  next === "" ? "" : Math.max(1, Number(next)),
                );
              }}
            />
          </div>
        )}
      </div>
    </FormSection>
  );
}
