import { COACH_COUNTRY_OPTIONS } from "../coachForm.config";
import { SelectInput } from "./CoachFormField";

export default function CoachProfileFields({ form, errors, updateField }) {
  return (
    <SelectInput
      value={form.nationality}
      onChange={(event) => updateField("nationality", event.target.value)}
      error={errors.nationality}
    >
      <option value="">Nationalität auswählen *</option>
      {COACH_COUNTRY_OPTIONS.map((country) => (
        <option key={country.iso} value={country.iso}>
          {country.flag} {country.de}
        </option>
      ))}
    </SelectInput>
  );
}
