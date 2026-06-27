import { GENDER_OPTIONS, STRONG_FOOT } from "@/constants";
import { COUNTRY_OPTIONS } from "../playerForm.config";
import { InputField, SelectField } from "./FormField";

export default function PlayerProfileFields({
  form,
  errors,
  calculatedYearGroup,
  updateField,
}) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <InputField
            type="date"
            value={form.birthdate}
            onChange={(event) => updateField("birthdate", event.target.value)}
            error={errors.birthdate}
          />

          {calculatedYearGroup && (
            <p className="mt-2 text-sm text-white/40">
              Jahrgang: {calculatedYearGroup}
            </p>
          )}
        </div>

        <SelectField
          value={form.strong_foot}
          onChange={(event) => updateField("strong_foot", event.target.value)}
        >
          <option value="">Starker Fuß auswählen</option>
          {STRONG_FOOT.map((foot) => (
            <option key={foot} value={foot}>
              {foot}
            </option>
          ))}
        </SelectField>

        <SelectField
          value={form.gender}
          onChange={(event) => updateField("gender", event.target.value)}
          error={errors.gender}
        >
          <option value="">Geschlecht auswählen *</option>
          {GENDER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>

        <SelectField
          value={form.nationality}
          onChange={(event) => updateField("nationality", event.target.value)}
          error={errors.nationality}
        >
          <option value="">Nationalität auswählen *</option>
          {COUNTRY_OPTIONS.map((country) => (
            <option key={country.iso} value={country.iso}>
              {country.flag} {country.de}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <InputField
          type="date"
          value={form.joined_at}
          onChange={(event) => updateField("joined_at", event.target.value)}
          placeholder="Im Verein seit"
        />
      </div>
    </>
  );
}
