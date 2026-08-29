import Link from "next/link";
import { PublicCard, PublicPageHero, PublicPageShell } from "@/components/website/layout";

const areas = [
  ["Mannschaften", "/tischtennis/mannschaften"],
  ["Spielplan & Tabelle", "/tischtennis/spielplan-tabelle"],
  ["Vorstand", "/tischtennis/vorstand"],
  ["Termine", "/tischtennis/termine"],
];

export default function TableTennisPage() {
  return (
    <PublicPageShell>
      <section>
        <PublicPageHero eyebrow="Abteilung" title="Tischtennis" description="Hier entsteht der Bereich der Tischtennisabteilung der DJK/VfL Giesenkirchen 05/09 e.V. mit Informationen zu Trainingszeiten, Mannschaften, Ansprechpartnern und aktuellen Neuigkeiten." />
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {areas.map(([label, href]) => (
            <PublicCard as={Link} key={href} href={href} className="p-5 font-bold transition hover:border-red-500 hover:bg-white/[0.07] sm:p-5">{label}</PublicCard>
          ))}
        </div>
      </section>
    </PublicPageShell>
  );
}
