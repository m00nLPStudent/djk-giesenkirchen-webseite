import { InputField, StatusSwitch } from "@/components/admin/forms";

export function CoachSortOrderField({ form, updateField }) {
  return (
    <div className="max-w-xs">
      <InputField
        label="Reihenfolge"
        type="number"
        value={form.sort_order}
        onChange={(event) => updateField("sort_order", event.target.value)}
      />
    </div>
  );
}

export function CoachStatusField({ form, updateField }) {
  return (
    <StatusSwitch
      checked={form.is_active}
      onChange={(value) => updateField("is_active", value)}
      description="Steuert, ob der Trainer öffentlich angezeigt wird."
    />
  );
}

export default function CoachSettingsFields({ form, updateField }) {
  return (
    <div className="space-y-6">
      <CoachSortOrderField form={form} updateField={updateField} />
      <CoachStatusField form={form} updateField={updateField} />
    </div>
  );
}
