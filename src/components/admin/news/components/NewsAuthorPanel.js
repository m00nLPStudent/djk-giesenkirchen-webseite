import { FormSection } from "@/components/admin/forms";
import NewsCategoryFields from "../forms/NewsCategoryFields";

export default function NewsAuthorPanel({ form, teams, categories, updateField }) {
  return (
    <FormSection
      eyebrow="Kategorie"
      title="News einordnen"
      description="Wähle aus, ob es eine allgemeine Vereinsmeldung, Fußball-News oder eine andere Kategorie ist. Bei Fußball kannst du zusätzlich eine Mannschaft auswählen."
    >
      <NewsCategoryFields form={form} teams={teams} categories={categories} updateField={updateField} />
    </FormSection>
  );
}
