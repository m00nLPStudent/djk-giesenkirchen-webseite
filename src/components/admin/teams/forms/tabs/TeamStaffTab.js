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
      title="Trainer und Betreuer dieser Saison"
      description="Aktive Coach-Zuordnungen werden fuer diese Team-Saison aus coach_team_seasons geladen und bleiben auch bei Mehrfachzuordnungen sichtbar."
    >
      <TeamSelectionList
        items={items}
        selectedIds={selectedIds}
        onChange={onChange}
        getLabel={getPersonName}
        getMeta={(coach) =>
          [
            (coach.currentRoleLabels || []).join(", ") ||
              ((coach.reactivationRoleLabels || []).length > 0
                ? `Reaktiviert mit: ${(coach.reactivationRoleLabels || []).join(", ")}`
                : coach.legacyRoleFallbackUsed
                  ? `Fallback-Rolle: ${(coach.legacyRoleLabels || []).join(", ")}`
                  : "Keine aktuelle Teamrolle"),
            coach.otherActiveAssignmentCount > 0
              ? `+${coach.otherActiveAssignmentCount} weitere Teamzuordnung(en)`
              : null,
            coach.license,
          ]
            .filter(Boolean)
            .join(" · ")
        }
        emptyText="Fuer diese Mannschaft sind noch keine Trainer oder Betreuer angelegt oder zugeordnet."
      />
    </FormSection>
  );
}
