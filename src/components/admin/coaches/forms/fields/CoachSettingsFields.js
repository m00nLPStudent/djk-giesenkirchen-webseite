import { ActiveStatusField, SortOrderField } from "@/components/admin/forms";

export function CoachSortOrderField({ form, updateField }) {
  return (
    <SortOrderField
      value={form.sort_order}
      onChange={(value) => updateField("sort_order", value)}
    />
  );
}

export function CoachStatusField({ form, updateField }) {
  return (
    <ActiveStatusField
      checked={form.is_active}
      onChange={(value) => updateField("is_active", value)}
      entityLabel="Trainer"
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
