import { FormSection } from "@/components/admin/forms";
import TeamFootballDeFields from "../fields/TeamFootballDeFields";

export default function TeamCompetitionTab({ form, onFieldChange, departmentSlug = null }) {
  if (departmentSlug === "tischtennis") {
    return <FormSection eyebrow="Spielbetrieb" title="Tischtennis-Spielbetrieb" description="Die Spielbetriebs-Integration für Tischtennis wird separat eingerichtet." />;
  }
  return (
    <FormSection
      eyebrow="Spielbetrieb"
      title="fussball.de Integration"
      description="Widget-Code aus fussball.de einfügen. Gespeichert werden automatisch nur die Widget-IDs."
    >
      <TeamFootballDeFields form={form} updateField={onFieldChange} />
    </FormSection>
  );
}
