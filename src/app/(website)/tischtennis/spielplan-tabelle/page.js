import { PublicCard, PublicPageHero, PublicPageShell } from "@/components/website/layout";
import Link from "next/link";
import { loadPublicTableTennisCompetitionBySlug, loadPublicTableTennisCompetitionOptions, TableTennisCompetitionView } from "@/components/website/table-tennis";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tischtennis Spielplan & Tabelle | DJK/VfL Giesenkirchen", description: "Aktuelle Tabellen und Mannschaftsspielpläne der Tischtennisabteilung." };

export default async function TableTennisSchedulePage({ searchParams }) {
  const query = await searchParams;
  const optionsResult = await loadPublicTableTennisCompetitionOptions();
  const options = optionsResult.data || [];
  const requested = typeof query?.team === "string" ? query.team : null;
  const selected = options.find((item) => item.slug === requested) || options[0] || null;
  const result = selected ? await loadPublicTableTennisCompetitionBySlug(selected.slug, { preloadedOptions: options }) : { data: null, error: optionsResult.error };
  return <PublicPageShell><PublicPageHero eyebrow="Tischtennis" title="Spielplan & Tabelle" description="Aktuelle Ligatabellen und Mannschaftsspielpläne unserer Tischtennismannschaften." />
    {options.length ? <nav aria-label="Tischtennismannschaft auswählen" className="mt-8 flex flex-wrap gap-2">{options.map((item) => { const active = item.slug === selected?.slug; return <Link key={item.slug} href={`/tischtennis/spielplan-tabelle?team=${encodeURIComponent(item.slug)}`} aria-current={active ? "page" : undefined} className={`min-h-11 rounded-full px-5 py-3 text-sm font-black transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 ${active ? "bg-red-600 text-white" : "border border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white"}`}>{item.name}</Link>; })}</nav> : null}
    <div className="mt-8">{optionsResult.error ? <PublicCard><p className="text-white/60">Die aktuellen Spielbetriebsdaten sind momentan nicht verfügbar.</p></PublicCard> : !selected ? <PublicCard><h2 className="text-2xl font-black">Noch keine Mannschaft verfügbar</h2><p className="mt-4 text-white/60">Derzeit ist keine aktive Tischtennismannschaft mit Spielbetriebsintegration hinterlegt.</p></PublicCard> : result.data ? <TableTennisCompetitionView competition={result.data.competition} /> : <PublicCard><p className="text-white/60">Die aktuellen Spielbetriebsdaten sind momentan nicht verfügbar.</p></PublicCard>}</div>
  </PublicPageShell>;
}
