import { InputField, SelectField } from "./FormField";

export default function PlayerSportFields({
  form,
  errors,
  positionOptions,
  updateField,
  updatePosition,
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SelectField
        value={form.position_de}
        onChange={(event) => updatePosition(event.target.value)}
        error={errors.position_de}
      >
        <option value="">Position auswählen *</option>
        {positionOptions.map((position) => (
          <option key={position} value={position}>
            {position}
          </option>
        ))}
      </SelectField>

      <InputField
        placeholder="Position Englisch"
        value={form.position_en}
        onChange={(event) => updateField("position_en", event.target.value)}
      />
    </div>
  );
}
