import { FormSection } from "@/components/admin/forms";
import TeamSelectionList from "../components/TeamSelectionList";

export default function TeamPlayersTab({
  items = [],
  selectedIds = [],
  onChange,
  getPersonName,
}) {
  return (
    <FormSection
      eyebrow="Kader"
      title="Spieler dieser Saison"
      description="Angezeigt werden nur Spieler, die bei der Spielererstellung dieser Mannschaft zugeordnet wurden."
    >
      <TeamSelectionList
        items={items}
        selectedIds={selectedIds}
        onChange={onChange}
        getLabel={getPersonName}
        getMeta={(player) =>
          [player.position_de, player.year_group].filter(Boolean).join(" · ")
        }
        emptyText="Für diese Mannschaft sind noch keine Spieler angelegt oder zugeordnet."
      />
    </FormSection>
  );
}
