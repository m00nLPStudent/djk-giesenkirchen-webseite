import PublicSectionPlaceholder from "@/components/website/content/PublicSectionPlaceholder";

export default function FootballTournamentsPage() {
  return <PublicSectionPlaceholder eyebrow="Fußball" title="Turniere & Events" description="Künftige Fußballturniere und besondere Abteilungsveranstaltungen erhalten hier einen gemeinsamen, verlässlichen Einstieg. Ein neues Verwaltungssystem ist damit nicht verbunden." items={["Turniere", "Abteilungsveranstaltungen", "Organisatorische Hinweise"]} backHref="/fussball" backLabel="Zur Fußballübersicht" />;
}
