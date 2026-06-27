import { InputField, SelectField } from "./FormField";

export default function PlayerBasicFields({ form, errors, teams, updateField }) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <InputField
          placeholder="Vorname *"
          value={form.first_name}
          onChange={(event) => updateField("first_name", event.target.value)}
          error={errors.first_name}
        />

        <InputField
          placeholder="Nachname *"
          value={form.last_name}
          onChange={(event) => updateField("last_name", event.target.value)}
          error={errors.last_name}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          value={form.team_id}
          onChange={(event) => updateField("team_id", event.target.value)}
          error={errors.team_id}
        >
          <option value="">Mannschaft auswählen *</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name_de}
            </option>
          ))}
        </SelectField>

        <InputField
          type="number"
          placeholder="Rückennummer"
          value={form.shirt_number}
          onChange={(event) => updateField("shirt_number", event.target.value)}
        />
      </div>
    </>
  );
}
