import { notFound } from "next/navigation";
import { PublicPageShell } from "@/components/website/layout";
import { TeamIntroCard, TeamOverviewBackLink } from "@/components/website/team";
import { TABLE_TENNIS_TEAM_OVERVIEW_ROUTE } from "@/components/website/team/teamOverviewNavigation.core.mjs";
import { loadPublicTableTennisTeamBySlug, TableTennisTeamDetailTabs, TableTennisTeamHero } from "@/components/website/table-tennis";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const result = await loadPublicTableTennisTeamBySlug(slug);
  if (!result.data) return { title: "Mannschaft nicht gefunden", robots: { index: false, follow: false } };
  return { title: `${result.data.team.name} | Tischtennis`, description: result.data.team.description || `${result.data.team.name} der Tischtennisabteilung.` };
}

export default async function TableTennisTeamPage({ params }) {
  const { slug } = await params;
  const result = await loadPublicTableTennisTeamBySlug(slug);
  if (!result.data) notFound();
  const { team, training, roster, coaches, contact, competition } = result.data;
  const introTeam = { name_de: team.name, description_de: team.description, public_season_name: team.season?.name };
  return <PublicPageShell className="space-y-8">
    <TeamOverviewBackLink href={TABLE_TENNIS_TEAM_OVERVIEW_ROUTE} />
    <TableTennisTeamHero team={team} />
    <TeamIntroCard team={introTeam} departmentLabel="Tischtennisabteilung" emptyDescription="Für diese Mannschaft ist aktuell keine Beschreibung hinterlegt." />
    <TableTennisTeamDetailTabs training={training} roster={roster} coaches={coaches} contact={contact} competition={competition} />
  </PublicPageShell>;
}
