import { PublicCard, PublicPageHero, PublicPageShell } from "@/components/website/layout";
import { loadPublicTableTennisTeamSummaries, TableTennisTrainingList } from "@/components/website/table-tennis";

export const metadata = { title: "Tischtennis-Trainingszeiten | DJK/VfL Giesenkirchen", description: "Trainingszeiten und Trainingsorte der Tischtennis-Mannschaften." };

export default async function TableTennisTrainingTimesPage() {
  const result = await loadPublicTableTennisTeamSummaries();
  const entries = (result.data || []).flatMap((team) => team.training.map((training) => ({ ...training, team })));
  return <PublicPageShell><PublicPageHero eyebrow="Tischtennis" title="Trainingszeiten" description="Die aktuellen Trainingsangebote unserer Tischtennis-Mannschaften." /><PublicCard className="mt-10">{result.error ? <p className="text-white/55">Die Trainingszeiten konnten derzeit nicht geladen werden.</p> : <TableTennisTrainingList entries={entries} showTeam />}</PublicCard></PublicPageShell>;
}
