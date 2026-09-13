import Link from "next/link";
import { FootballDeSection, loadPublicFootballWidgetTeams } from "@/components/website/football-de";
import { PublicCard, PublicPageHero, PublicPageShell } from "@/components/website/layout";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Fußball Spielplan & Tabelle",
  description: "Aktuelle Tabellen und Spielpläne unserer Fußballmannschaften.",
};

export default async function FootballSchedulePage({ searchParams }) {
  const query = await searchParams;
  const result = await loadPublicFootballWidgetTeams();
  const teams = result.data || [];
  const requested = typeof query?.team === "string" ? query.team : null;
  const selected = teams.find((team) => team.slug === requested) || teams[0] || null;

  return (
    <PublicPageShell>
      <PublicPageHero eyebrow="Fußball" title="Spielplan & Tabelle" description="Offizielle Spielpläne und Tabellen unserer Fußballmannschaften direkt von fussball.de." />
      {teams.length ? (
        <nav aria-label="Fußballmannschaft auswählen" className="mt-8 flex flex-wrap gap-2">
          {teams.map((team) => {
            const active = team.slug === selected?.slug;
            return <Link key={team.slug} href={`/fussball/spielplan-tabelle?team=${encodeURIComponent(team.slug)}`} aria-current={active ? "page" : undefined} className={`min-h-11 rounded-full px-5 py-3 text-sm font-black transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 ${active ? "bg-red-600 text-white" : "border border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white"}`}>{team.name}</Link>;
          })}
        </nav>
      ) : null}
      <div className="mt-8 min-w-0">
        {result.error ? <PublicCard><p className="text-white/60">Die Spielbetriebsdaten konnten derzeit nicht geladen werden.</p></PublicCard> : selected ? <FootballDeSection key={selected.slug} team={selected} /> : <PublicCard><h2 className="text-2xl font-black">Noch keine Mannschaft verfügbar</h2><p className="mt-4 text-white/60">Derzeit ist keine aktive Fußballmannschaft mit Spielplan oder Tabelle konfiguriert.</p></PublicCard>}
      </div>
    </PublicPageShell>
  );
}
