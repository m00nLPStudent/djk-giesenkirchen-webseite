import {
  ActiveStatusField,
  BooleanOptionField,
  SortOrderField,
} from "@/components/admin/forms";

export default function PlayerSettingsFields({ form, updateField }) {
  return (
    <div className="space-y-6">
      <SortOrderField
        value={form.assignment_sort_order}
        onChange={(value) => updateField("assignment_sort_order", value)}
      />

      <ActiveStatusField
        checked={form.is_active}
        onChange={(value) => updateField("is_active", value)}
        entityLabel="Spieler"
      />

      <BooleanOptionField
        title="Spielführer"
        description="Markiert den Spieler als Kapitän der Mannschaft."
        checked={form.is_captain}
        onChange={(value) => updateField("is_captain", value)}
      />
    </div>
  );
}
