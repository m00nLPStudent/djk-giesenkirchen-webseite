import Link from "next/link";
import { PublicCard, PublicPageHero, PublicPageShell } from "@/components/website/layout";
import { formatTableTennisWeekday, loadPublicTableTennisBoard, loadPublicTableTennisTeamSummaries, TableTennisTeamCard } from "@/components/website/table-tennis";

export const metadata = { title: "Tischtennis | DJK/VfL Giesenkirchen", description: "Mannschaften, Trainingszeiten und Ansprechpartner der Tischtennisabteilung." };

const areas = [["Mannschaften", "/tischtennis/mannschaften"], ["Trainingszeiten", "/tischtennis/trainingszeiten"], ["Vorstand", "/tischtennis/vorstand"], ["Spielplan & Tabelle", "/tischtennis/spielplan-tabelle"]];

export default async function TableTennisPage() {
  const [teamsResult, boardResult] = await Promise.all([loadPublicTableTennisTeamSummaries(), loadPublicTableTennisBoard()]);
  const teams = teamsResult.data || [];
  const firstTraining = teams.flatMap((team) => team.training.map((training) => ({ ...training, team }))).at(0);
  const firstBoardMember = (boardResult.data || [])[0];
  return <PublicPageShell>
    <PublicPageHero eyebrow="Abteilung" title="Tischtennis" description="Mannschaften, Trainingszeiten und Ansprechpartner der Tischtennisabteilung der DJK/VfL Giesenkirchen 05/09 e.V." />
    <nav aria-label="Tischtennisbereiche" className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{areas.map(([label, href]) => <PublicCard as={Link} key={href} href={href} className="p-5 font-bold transition hover:border-red-500 hover:bg-white/[0.07]">{label}</PublicCard>)}</nav>
    <section className="mt-14"><p className="text-xs font-black uppercase tracking-[0.3em] text-red-400">Aktuelle Saison</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">Unsere Mannschaften</h2>
      {teamsResult.error ? <p className="mt-6 text-white/55">Die Mannschaften konnten derzeit nicht geladen werden.</p> : teams.length ? <div className="mt-7 grid gap-6 md:grid-cols-2">{teams.map((team) => <TableTennisTeamCard key={team.id} team={team} />)}</div> : <p className="mt-6 text-white/55">Aktuell sind keine aktiven Mannschaften veröffentlicht.</p>}
    </section>
    <div className="mt-14 grid gap-6 md:grid-cols-2">
      <PublicCard><p className="text-xs font-black uppercase tracking-[0.25em] text-red-400">Training</p><h2 className="mt-3 text-2xl font-black">Trainingszeiten</h2><p className="mt-4 text-white/60">{firstTraining ? `${firstTraining.team.name}: ${formatTableTennisWeekday(firstTraining.weekday)}${firstTraining.startTime ? ` ab ${String(firstTraining.startTime).slice(0, 5)} Uhr` : ""}` : "Aktuell sind keine Trainingszeiten hinterlegt."}</p><Link href="/tischtennis/trainingszeiten" className="mt-5 inline-block font-bold text-red-400">Alle Trainingszeiten</Link></PublicCard>
      <PublicCard><p className="text-xs font-black uppercase tracking-[0.25em] text-red-400">Ansprechpartner</p><h2 className="mt-3 text-2xl font-black">Vorstand Tischtennis</h2><p className="mt-4 text-white/60">{firstBoardMember ? `${firstBoardMember.name}${firstBoardMember.role ? ` · ${firstBoardMember.role}` : ""}` : "Aktuell ist kein öffentlicher Ansprechpartner hinterlegt."}</p><Link href="/tischtennis/vorstand" className="mt-5 inline-block font-bold text-red-400">Zum Vorstand</Link></PublicCard>
    </div>
  </PublicPageShell>;
}
