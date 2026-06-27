import { CountrySelectField } from "@/components/admin/forms";
import { COACH_COUNTRY_OPTIONS } from "../coachForm.config";

export default function CoachProfileFields({ form, errors, updateField }) {
  return (
    <CountrySelectField
      required
      options={COACH_COUNTRY_OPTIONS}
      value={form.nationality}
      onChange={(value) => updateField("nationality", value)}
      error={errors.nationality}
    />
  );
}
