import PublicSectionPlaceholder from "@/components/website/content/PublicSectionPlaceholder";

export default function ClubBoardPage() {
  return <PublicSectionPlaceholder eyebrow="Gesamtverein" title="Vorstand Gesamtverein" description="Hier entsteht die zentrale Übersicht der gewählten Vereinsvertretung. Bestehende Fußballvorstände werden fachlich getrennt auf ihrer Abteilungsseite geführt." items={["Vorstandsmitglieder", "Funktionen und Zuständigkeiten", "Zentrale Kontaktwege"]} backHref="/verein" backLabel="Zur Vereinsübersicht" />;
}
