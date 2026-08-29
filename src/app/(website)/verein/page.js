import Link from "next/link";
import { PublicCard, PublicPageHero, PublicPageShell } from "@/components/website/layout";

const clubAreas = [
  {
    title: "Fußball",
    description:
      "Alle Mannschaften, Ansprechpartner, Sponsoren und Termine rund um den Fußballbereich.",
    href: "/fussball",
    eyebrow: "Abteilung",
  },
  {
    title: "Tischtennis",
    description:
      "Informationen zur Tischtennisabteilung mit Trainingsangeboten und Ansprechpartnern.",
    href: "/tischtennis",
    eyebrow: "Abteilung",
  },
  {
    title: "Behindertensport",
    description:
      "Informationen zu Angeboten, Aktivitäten und Ansprechpartnern im Behindertensport.",
    href: "/behindertensport",
    eyebrow: "Abteilung",
  },
  {
    title: "Damen-Gymnastik",
    description:
      "Übersicht zur Damen-Gymnastik mit Angeboten, Trainingszeiten und Kontakten.",
    href: "/damen-gymnastik",
    eyebrow: "Abteilung",
  },
];

export default function ClubOverviewPage() {
  return (
    <PublicPageShell>
      <section>
        <PublicPageHero eyebrow="Verein" title="Vereinsbereiche" description="Die DJK/VfL Giesenkirchen vereint vier Abteilungen unter einem gemeinsamen Vereinsdach." />

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/verein/vorstand" className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold hover:border-red-500 hover:bg-white/10">Vorstand Gesamtverein</Link>
          <Link href="/verein/vereinsgeschichte" className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold hover:border-red-500 hover:bg-white/10">Vereinsgeschichte</Link>
          <Link href="/termine" className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold hover:border-red-500 hover:bg-white/10">Termine</Link>
          <Link href="/news" className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold hover:border-red-500 hover:bg-white/10">News</Link>
          <Link href="/downloads" className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold hover:border-red-500 hover:bg-white/10">Downloads</Link>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {clubAreas.map((area) => (
            <PublicCard
              as={Link}
              key={area.href}
              href={area.href}
              className="group min-w-0 transition hover:-translate-y-1 hover:border-red-500/60 hover:bg-white/[0.07]"
            >
              <p className="text-xs font-black uppercase tracking-[0.24em] text-red-400">
                {area.eyebrow}
              </p>
              <h2 className="mt-3 break-words text-2xl font-black leading-tight">
                {area.title}
              </h2>
              <p className="mt-3 break-words text-sm leading-7 text-white/60">
                {area.description}
              </p>
              <span className="mt-6 inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white/70 transition group-hover:border-red-500 group-hover:text-white">
                Öffnen
              </span>
            </PublicCard>
          ))}
        </div>
      </section>
    </PublicPageShell>
  );
}
