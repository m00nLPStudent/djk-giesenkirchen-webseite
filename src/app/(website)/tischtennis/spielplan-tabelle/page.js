import PublicSectionPlaceholder from "@/components/website/content/PublicSectionPlaceholder";

export default function TableTennisSchedulePage() {
  return <PublicSectionPlaceholder eyebrow="Tischtennis" title="Spielplan & Tabelle" description="Hier ist der vorgesehene Platz für eine spätere offizielle Einbindung von myTischtennis.de. Fragiles Scraping oder eine inoffizielle Datenübernahme wird nicht eingesetzt." items={["Spielplan", "Ergebnisse", "Tabellen"]} backHref="/tischtennis" backLabel="Zur Tischtennisübersicht" />;
}
