import Link from "next/link";

const cards = [
  {
    title: "Vorstand",
    eyebrow: "Fußballabteilung",
    description: "Alle Ansprechpartner aus dem Vorstand der Fußballabteilung mit Funktion und Kontaktdaten.",
    href: "/fussball/abteilung/vorstand",
  },
  {
    title: "Trainer & Betreuer",
    eyebrow: "Team hinter dem Team",
    description: "Übersicht aller Trainer und Betreuer mit Mannschaftszuordnung, Lizenz und Kontaktmöglichkeiten.",
    href: "/fussball/abteilung/trainer",
  },
];

export default function FootballDepartmentPage() {
  return (
    <main className="min-h-screen bg-[#101014] px-6 pt-48 pb-24 text-white md:pt-56">
      <section className="mx-auto max-w-7xl">
        <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">Fußballabteilung</p>
        <h1 className="mt-5 max-w-4xl text-5xl font-black leading-tight md:text-7xl">Abteilung & Ansprechpartner</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-white/60">
          Wähle aus, ob du die Ansprechpartner des Vorstands oder unser Trainer- und Betreuerteam sehen möchtest.
        </p>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-3xl border border-white/10 bg-white/5 p-8 transition hover:-translate-y-1 hover:border-red-500/60 hover:bg-white/10"
            >
              <p className="text-xs font-black uppercase tracking-[0.28em] text-red-400">{card.eyebrow}</p>
              <h2 className="mt-4 text-4xl font-black">{card.title}</h2>
              <p className="mt-4 max-w-xl text-white/55">{card.description}</p>
              <span className="mt-8 inline-flex rounded-full bg-red-600 px-6 py-3 text-sm font-black text-white transition group-hover:bg-red-700">
                Anzeigen
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
