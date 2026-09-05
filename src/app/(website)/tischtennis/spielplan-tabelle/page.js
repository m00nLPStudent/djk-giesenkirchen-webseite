import Link from "next/link";
import { PublicCard, PublicPageHero, PublicPageShell } from "@/components/website/layout";

export const metadata = { title: "Tischtennis Spielplan & Tabelle | DJK/VfL Giesenkirchen", description: "Hinweise zum künftigen offiziellen Spielplan- und Tabellenangebot." };

export default function TableTennisSchedulePage() {
  return <PublicPageShell><PublicPageHero eyebrow="Tischtennis" title="Spielplan & Tabelle" description="Die offizielle Spielplan- und Tabellenintegration für Tischtennis wird separat angebunden." /><PublicCard className="mt-10"><h2 className="text-2xl font-black">Offizielle Informationen folgen</h2><p className="mt-4 max-w-3xl leading-7 text-white/60">Spielpläne, Ergebnisse und Tabellen werden künftig über die vorgesehene offizielle Tischtennis-Integration bereitgestellt. Bis dahin zeigen wir hier keine unbestätigten oder nachgebauten Daten.</p><Link href="/tischtennis" className="mt-6 inline-block font-bold text-red-400">Zur Tischtennisübersicht</Link></PublicCard></PublicPageShell>;
}
