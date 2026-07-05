import Link from "next/link";
const TERMINE_CARDS = [
  {
    eyebrow: "Training",
    title: "Trainingstermine",
    description:
      "Automatische Trainingszeiten der Mannschaften mit kompakter Auswahl für die nächsten Tage.",
    href: "/termine/training",
    cta: "Zu den Trainingsterminen",
  },
  {
    eyebrow: "Verein",
    title: "Allgemeine Termine",
    description:
      "Vereinsveranstaltungen, Sitzungen, Turniere, Jahreshauptversammlungen und weitere öffentliche Termine.",
    href: "/termine/allgemein",
    cta: "Zu den allgemeinen Terminen",
  },
];

export default function EventsPage() {
  return (
    <main className="min-h-screen bg-[#101014] px-4 pt-28 pb-20 text-white sm:px-6 md:pt-32 md:pb-24">
      <section className="mx-auto max-w-7xl space-y-14">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
            Verein
          </p>
          <h1 className="mt-4 text-4xl font-black md:text-7xl">Termine</h1>
          <p className="mt-6 max-w-3xl text-base leading-7 text-white/70 md:text-lg md:leading-8">
            Wähle zwischen automatischen Trainingsterminen und allgemeinen
            Vereinsterminen.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {TERMINE_CARDS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-[2rem] border border-white/10 bg-white/5 p-6 md:p-8 transition hover:border-red-500/40 hover:bg-white/10"
            >
              <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
                {item.eyebrow}
              </p>
              <h2 className="mt-5 text-3xl font-black leading-tight md:text-5xl">
                {item.title}
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/65 md:text-lg md:leading-8">
                {item.description}
              </p>
              <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-red-300 transition group-hover:text-red-200">
                {item.cta}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
