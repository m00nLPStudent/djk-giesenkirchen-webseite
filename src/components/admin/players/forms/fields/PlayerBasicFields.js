import { FormGrid } from "@/components/admin/forms";
import { InputField, SelectField } from "./FormField";

export default function PlayerBasicFields({
  form,
  errors,
  teamOptions,
  updateField,
  sportContext = "football",
}) {
  return (
    <div className="space-y-4">
      <FormGrid>
        <InputField
          label="Vorname"
          required
          placeholder="Vorname"
          value={form.first_name}
          onChange={(event) => updateField("first_name", event.target.value)}
          error={errors.first_name}
        />

        <InputField
          label="Nachname"
          required
          placeholder="Nachname"
          value={form.last_name}
          onChange={(event) => updateField("last_name", event.target.value)}
          error={errors.last_name}
        />
      </FormGrid>

      <FormGrid>
        <SelectField
          label="Mannschaft (optional)"
          value={form.team_season_id}
          onChange={(event) =>
            updateField("team_season_id", event.target.value)
          }
          error={errors.team_season_id}
        >
          <option value="">
            {teamOptions.length > 0
              ? "Keine Mannschaft"
              : "Keine Mannschaft verfügbar"}
          </option>
          {teamOptions.map((teamOption) => (
            <option
              key={teamOption.teamSeasonId}
              value={teamOption.teamSeasonId}
            >
              {teamOption.teamNameDe}
            </option>
          ))}
        </SelectField>

        {sportContext !== "table_tennis" ? (
          <InputField
            label="Rückennummer"
            type="number"
            placeholder="z. B. 10"
            value={form.shirt_number}
            onChange={(event) => updateField("shirt_number", event.target.value)}
          />
        ) : null}
      </FormGrid>
    </div>
  );
}
