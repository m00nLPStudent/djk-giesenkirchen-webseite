import PublicSectionPlaceholder from "@/components/website/content/PublicSectionPlaceholder";

export default function TableTennisTeamsPage() {
  return <PublicSectionPlaceholder eyebrow="Tischtennis" title="Mannschaften" description="Die beiden Tischtennismannschaften erhalten hier künftig ihre fachlich gepflegten Übersichten. In diesem Schritt werden noch keine nicht vorhandenen Mannschaftsdaten erfunden." items={["1. Mannschaft", "2. Mannschaft"]} backHref="/tischtennis" backLabel="Zur Tischtennisübersicht" />;
}
