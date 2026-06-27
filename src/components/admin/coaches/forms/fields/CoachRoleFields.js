import { FormGrid } from "@/components/admin/forms";
import { coachLicenses, coachRoles } from "../../constants/CoachOptions";
import { SelectInput } from "./CoachFormField";

export default function CoachRoleFields({ form, errors, teams = [], updateField }) {
  return (
    <FormGrid>
      <SelectInput
        label="Funktion"
        required
        value={form.role}
        onChange={(event) => updateField("role", event.target.value)}
        error={errors.role}
      >
        <option value="">Funktion auswählen</option>
        {coachRoles.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </SelectInput>

      <SelectInput
        label="Mannschaft"
        value={form.team_id}
        onChange={(event) => updateField("team_id", event.target.value)}
      >
        <option value="">Keine Mannschaft zugeordnet</option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name_de}
          </option>
        ))}
      </SelectInput>

      <SelectInput
        label="Lizenz"
        value={form.license}
        onChange={(event) => updateField("license", event.target.value)}
      >
        {coachLicenses.map((license) => (
          <option key={license} value={license}>
            {license}
          </option>
        ))}
      </SelectInput>
    </FormGrid>
  );
}
