import Link from "next/link";

const overviewCards = [
  {
    title: "Mannschaften",
    description:
      "Alle Junioren-, Senioren- und Damenmannschaften im Überblick.",
    href: "/fussball/mannschaften",
    eyebrow: "Spielbetrieb",
  },
  {
    title: "Abteilung",
    description:
      "Zur Übersichtsseite der Fußballabteilung mit den wichtigsten Bereichen.",
    href: "/fussball/abteilung",
    eyebrow: "Struktur",
  },
  {
    title: "Trainer",
    description: "Direkt zu allen Trainern und Betreuern der Fußballabteilung.",
    href: "/fussball/abteilung/trainer",
    eyebrow: "Ansprechpartner",
  },
  {
    title: "Vorstand",
    description: "Ansprechpartner des Vorstands der Fußballabteilung.",
    href: "/fussball/abteilung/vorstand",
    eyebrow: "Ansprechpartner",
  },
  {
    title: "Sponsoren",
    description: "Die Unterstützer und Partner des Fußballbereichs.",
    href: "/fussball/sponsoren",
    eyebrow: "Partner",
  },
  {
    title: "Turniere & Events",
    description:
      "Turniere, Veranstaltungen und weitere Termine rund um den Fußballbereich.",
    href: "/fussball/turniere-events",
    eyebrow: "Events",
  },
  {
    title: "Vereinsgeschichte",
    description:
      "Die Geschichte der Fußballabteilung und wichtige Meilensteine.",
    href: "/fussball/vereinsgeschichte",
    eyebrow: "Historie",
  },
];

export default async function FootballPage() {
  return (
    <main className="min-h-screen bg-[#101014] pt-28 pb-20 text-white md:pt-32 md:pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <section className="rounded-3xl border border-white/10 bg-black/20 p-6 md:p-9">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
              Übersicht
            </p>
            <h2 className="mt-4 text-2xl font-black sm:text-3xl md:text-5xl">
              Fußballbereich im Überblick
            </h2>
            <p className="mt-4 text-base leading-7 text-white/65 md:text-lg md:leading-8">
              Wähle direkt den Bereich aus, den du suchst.
            </p>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {overviewCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-red-500/60 hover:bg-white/10"
              >
                <p className="text-xs font-black uppercase tracking-[0.22em] text-red-400">
                  {card.eyebrow}
                </p>
                <h3 className="mt-3 text-2xl font-black">{card.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/60">
                  {card.description}
                </p>
                <span className="mt-6 inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white/70 transition group-hover:border-red-500 group-hover:text-white">
                  Öffnen
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
