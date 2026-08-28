import PublicSectionPlaceholder from "@/components/website/content/PublicSectionPlaceholder";

export default function TableTennisEventsPage() {
  return <PublicSectionPlaceholder eyebrow="Tischtennis" title="Termine" description="Abteilungstermine werden hier künftig getrennt und eindeutig dem Tischtennis zugeordnet. Bis dahin verweist die Seite nicht irreführend auf allgemeine Vereins- oder Fußballtermine." items={["Spieltage", "Abteilungstermine", "Veranstaltungen"]} backHref="/tischtennis" backLabel="Zur Tischtennisübersicht" />;
}
