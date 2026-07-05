import { FormSection, SelectField } from "@/components/admin/forms";

export default function TeamSeasonTab({
  seasons = [],
  seasonId,
  onSeasonChange,
}) {
  return (
    <FormSection
      eyebrow="Saison bearbeiten"
      title="Bearbeitungs-Saison auswählen"
      description="Wähle hier nur aus, welche Saison dieser Mannschaft du gerade bearbeiten möchtest. Welche Saison öffentlich angezeigt wird, stellst du unter Einstellungen ein."
    >
      <SelectField
        label="Diese Saison bearbeiten"
        required
        value={seasonId}
        onChange={(event) => onSeasonChange(event.target.value)}
      >
        <option value="">Saison auswählen</option>
        {seasons.map((season) => (
          <option key={season.id} value={season.id}>
            {season.name}
            {season.is_current ? " · aktuell öffentlich" : ""}
          </option>
        ))}
      </SelectField>
    </FormSection>
  );
}
