import {
  FormGrid,
  FormHintBox,
  FormSection,
  InputField,
  SelectField,
} from "@/components/admin/forms";

export default function TeamBaseTab({
  isEditMode,
  form,
  teamTemplates = [],
  onTeamTemplateChange,
}) {
  return (
    <FormSection
      eyebrow="Mannschaft"
      title="Grunddaten"
      description={
        isEditMode
          ? "Diese Grunddaten werden nur beim Erstellen einer Mannschaft festgelegt und sind danach gesperrt."
          : "Wähle eine Mannschaft aus der Vorlage aus. Slug und Altersgruppe werden automatisch übernommen."
      }
    >
      {isEditMode ? (
        <>
          <FormHintBox eyebrow="Gesperrte Grunddaten">
            Name, Slug und Altersgruppe können nach dem Erstellen nicht mehr
            direkt geändert werden, damit Spieler-, Trainer- und
            Saisonzuordnungen stabil bleiben.
          </FormHintBox>
          <div className="mt-6">
            <FormGrid>
              <InputField
                label="Mannschaft"
                required
                value={form.name_de}
                disabled
              />
              <InputField label="Slug" value={form.slug} disabled />
              <InputField
                label="Altersgruppe"
                value={form.age_group}
                disabled
              />
              <InputField
                label="Bearbeitete Saison"
                value={form.season}
                disabled
              />
            </FormGrid>
          </div>
        </>
      ) : (
        <FormGrid>
          <SelectField
            label="Mannschaft auswählen"
            required
            value={form.team_template_id}
            onChange={(event) => onTeamTemplateChange(event.target.value)}
          >
            <option value="">Mannschaft auswählen</option>
            {teamTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name_de}
              </option>
            ))}
          </SelectField>
          <InputField label="Slug" value={form.slug} disabled />
          <InputField label="Altersgruppe" value={form.age_group} disabled />
          <InputField label="Bearbeitete Saison" value={form.season} disabled />
        </FormGrid>
      )}
    </FormSection>
  );
}
