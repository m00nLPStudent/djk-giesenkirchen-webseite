import { FormGrid } from "@/components/admin/forms";
import { InputField, SelectField } from "./FormField";

export default function PlayerBasicFields({ form, errors, teams, updateField }) {
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
          label="Mannschaft"
          required
          value={form.team_id}
          onChange={(event) => updateField("team_id", event.target.value)}
          error={errors.team_id}
        >
          <option value="">Mannschaft auswählen</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name_de}
            </option>
          ))}
        </SelectField>

        <InputField
          label="Rückennummer"
          type="number"
          placeholder="z. B. 10"
          value={form.shirt_number}
          onChange={(event) => updateField("shirt_number", event.target.value)}
        />
      </FormGrid>
    </div>
  );
}
