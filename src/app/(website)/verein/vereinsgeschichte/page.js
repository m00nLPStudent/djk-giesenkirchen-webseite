import PublicSectionPlaceholder from "@/components/website/content/PublicSectionPlaceholder";

export default function ClubHistoryPage() {
  return <PublicSectionPlaceholder eyebrow="Gesamtverein" title="Vereinsgeschichte" description="Die gemeinsame Geschichte der DJK/VfL Giesenkirchen wird hier künftig unabhängig von der bestehenden Chronik der Fußballabteilung erzählt." items={["Gründung und Entwicklung", "Meilensteine des Gesamtvereins", "Historische Bilder und Dokumente"]} backHref="/verein" backLabel="Zur Vereinsübersicht" />;
}
