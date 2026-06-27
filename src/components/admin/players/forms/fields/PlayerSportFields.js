import { FormGrid } from "@/components/admin/forms";
import { InputField, SelectField } from "./FormField";

export default function PlayerSportFields({
  form,
  errors,
  positionOptions,
  updateField,
  updatePosition,
}) {
  return (
    <FormGrid>
      <SelectField
        label="Position"
        required
        value={form.position_de}
        onChange={(event) => updatePosition(event.target.value)}
        error={errors.position_de}
      >
        <option value="">Position auswählen</option>
        {positionOptions.map((position) => (
          <option key={position} value={position}>
            {position}
          </option>
        ))}
      </SelectField>

      <InputField
        label="Position Englisch"
        placeholder="z. B. Attack"
        value={form.position_en}
        onChange={(event) => updateField("position_en", event.target.value)}
      />
    </FormGrid>
  );
}
