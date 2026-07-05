import {
  ActiveStatusField,
  FormHintBox,
  FormSection,
  SelectField,
  SortOrderField,
} from "@/components/admin/forms";

export default function TeamSettingsTab({ form, seasons = [], onFieldChange }) {
  return (
    <FormSection
      eyebrow="Einstellungen"
      title="Status, Sortierung & öffentliche Saison"
    >
      <div className="space-y-6">
        <FormHintBox eyebrow="Öffentliche Anzeige">
          Diese Auswahl gilt für die komplette Website. Die hier gewählte Saison
          wird auf den öffentlichen Mannschaftsseiten angezeigt.
        </FormHintBox>
        <SelectField
          label="Öffentlich angezeigte Saison"
          value={form.public_season_id}
          onChange={(event) =>
            onFieldChange("public_season_id", event.target.value)
          }
        >
          {seasons.map((season) => (
            <option key={season.id} value={season.id}>
              {season.name}
              {season.id === form.public_season_id ? " · wird angezeigt" : ""}
            </option>
          ))}
        </SelectField>
        <SortOrderField
          value={form.sort_order}
          onChange={(value) => onFieldChange("sort_order", value)}
        />
        <ActiveStatusField
          checked={form.is_active}
          onChange={(value) => onFieldChange("is_active", value)}
          entityLabel="Mannschaft"
        />
      </div>
    </FormSection>
  );
}
