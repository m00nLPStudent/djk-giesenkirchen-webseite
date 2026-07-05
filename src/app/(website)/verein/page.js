import Link from "next/link";

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
    title: "Damen-Gymnastik",
    description:
      "Übersicht zur Damen-Gymnastik mit Angeboten, Trainingszeiten und Kontakten.",
    href: "/damen-gymnastik",
    eyebrow: "Abteilung",
  },
];

export default function ClubOverviewPage() {
  return (
    <main className="min-h-screen bg-[#101014] px-4 pt-32 pb-20 text-white sm:px-6 md:pt-56 md:pb-24">
      <section className="mx-auto max-w-7xl">
        <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
          Verein
        </p>
        <h1 className="mt-5 max-w-4xl break-words text-4xl font-black leading-tight md:text-7xl">
          Vereinsbereiche
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-7 text-white/60 md:text-lg md:leading-8">
          Wähle einen Bereich des Vereins und gelange direkt zur passenden
          Übersicht.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {clubAreas.map((area) => (
            <Link
              key={area.href}
              href={area.href}
              className="group min-w-0 rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-red-500/60 hover:bg-white/10"
            >
              <p className="text-xs font-black uppercase tracking-[0.24em] text-red-400">
                {area.eyebrow}
              </p>
              <h2 className="mt-3 break-words text-2xl font-black leading-tight text-white">
                {area.title}
              </h2>
              <p className="mt-3 break-words text-sm leading-7 text-white/60">
                {area.description}
              </p>
              <span className="mt-6 inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white/70 transition group-hover:border-red-500 group-hover:text-white">
                Öffnen
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
