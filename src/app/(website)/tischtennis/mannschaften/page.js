import { connection } from "next/server";
import { PublicPageHero, PublicPageShell } from "@/components/website/layout";
import { loadPublicTableTennisTeamSummaries, TableTennisTeamCard } from "@/components/website/table-tennis";

export const metadata = { title: "Tischtennis-Mannschaften | DJK/VfL Giesenkirchen", description: "Die aktiven Tischtennis-Mannschaften in der aktuellen Saison." };

export default async function TableTennisTeamsPage() {
  await connection();
  const result = await loadPublicTableTennisTeamSummaries();
  return <PublicPageShell><PublicPageHero eyebrow="Tischtennis" title="Mannschaften" description="Alle aktiven Mannschaften der aktuellen Saison auf einen Blick." />
    {result.error ? <p className="mt-8 text-white/55">Die Mannschaften konnten derzeit nicht geladen werden.</p> : result.data.length ? <div className="mt-10 grid gap-6 md:grid-cols-2">{result.data.map((team) => <TableTennisTeamCard key={team.id} team={team} />)}</div> : <p className="mt-8 text-white/55">Aktuell sind keine aktiven Mannschaften veröffentlicht.</p>}
  </PublicPageShell>;
}
