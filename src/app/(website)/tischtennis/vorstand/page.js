import { PublicPageHero, PublicPageShell } from "@/components/website/layout";
import { loadPublicTableTennisBoard, TableTennisPersonCard } from "@/components/website/table-tennis";

export const metadata = { title: "Tischtennis-Vorstand | DJK/VfL Giesenkirchen", description: "Vorstand und öffentliche Ansprechpartner der Tischtennisabteilung." };

export default async function TableTennisBoardPage() {
  const result = await loadPublicTableTennisBoard();
  return <PublicPageShell><PublicPageHero eyebrow="Tischtennis" title="Vorstand" description="Ansprechpartner und Funktionen der Tischtennisabteilung." />{result.error ? <p className="mt-8 text-white/55">Der Vorstand konnte derzeit nicht geladen werden.</p> : result.data.length ? <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{result.data.map((member) => <TableTennisPersonCard key={member.id} person={member} kind="Vorstand" />)}</div> : <p className="mt-8 text-white/55">Aktuell sind keine öffentlichen Vorstandsangaben hinterlegt.</p>}</PublicPageShell>;
}
