import { coachLicenses, coachRoles } from "../../constants/CoachOptions";
import { SelectInput } from "./CoachFormField";

export default function CoachRoleFields({ form, errors, teams = [], updateField }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SelectInput
        value={form.role}
        onChange={(event) => updateField("role", event.target.value)}
        error={errors.role}
      >
        <option value="">Funktion auswählen *</option>
        {coachRoles.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </SelectInput>

      <select
        value={form.team_id}
        onChange={(event) => updateField("team_id", event.target.value)}
        className="h-14 w-full rounded-2xl border border-white/10 bg-[#18181d] px-4 text-white outline-none focus:border-red-500"
      >
        <option value="">Keine Mannschaft zugeordnet</option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name_de}
          </option>
        ))}
      </select>

      <select
        value={form.license}
        onChange={(event) => updateField("license", event.target.value)}
        className="h-14 w-full rounded-2xl border border-white/10 bg-[#18181d] px-4 text-white outline-none focus:border-red-500 md:col-start-2"
      >
        {coachLicenses.map((license) => (
          <option key={license} value={license}>
            {license}
          </option>
        ))}
      </select>
    </div>
  );
}
