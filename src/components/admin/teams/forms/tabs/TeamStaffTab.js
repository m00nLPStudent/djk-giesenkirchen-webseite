import { FormSection } from "@/components/admin/forms";
import TeamSelectionList from "../components/TeamSelectionList";

export default function TeamStaffTab({
  items = [],
  selectedIds = [],
  onChange,
  getPersonName,
}) {
  return (
    <FormSection
      eyebrow="Team"
      title="Trainer & Betreuer dieser Saison"
      description="Angezeigt werden nur Trainer und Betreuer, die bei der Trainererstellung dieser Mannschaft zugeordnet wurden."
    >
      <TeamSelectionList
        items={items}
        selectedIds={selectedIds}
        onChange={onChange}
        getLabel={getPersonName}
        getMeta={(coach) =>
          [coach.role_de, coach.license].filter(Boolean).join(" · ")
        }
        emptyText="Für diese Mannschaft sind noch keine Trainer oder Betreuer angelegt oder zugeordnet."
      />
    </FormSection>
  );
}
