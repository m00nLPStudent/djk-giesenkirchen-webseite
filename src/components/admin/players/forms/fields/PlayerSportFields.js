import { STRONG_FOOT } from "@/constants";
import { POSITION_EN } from "../playerForm.config";
import { InputField, SelectField } from "./FormField";

export default function PlayerSportFields({
  form,
  errors,
  positionOptions,
  updateField,
  updatePosition,
}) {
  return (
    <>
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

      <input type="hidden" value={POSITION_EN[form.position_de] || ""} readOnly />

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
    </>
  );
}
