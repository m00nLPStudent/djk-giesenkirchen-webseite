import Link from "next/link";

const areas = [
  ["Mannschaften", "/tischtennis/mannschaften"],
  ["Spielplan & Tabelle", "/tischtennis/spielplan-tabelle"],
  ["Vorstand", "/tischtennis/vorstand"],
  ["Termine", "/tischtennis/termine"],
];

export default function TableTennisPage() {
  return (
    <main className="min-h-screen bg-[#101014] px-6 pt-32 pb-24 text-white">
      <section className="mx-auto max-w-7xl rounded-3xl border border-white/10 bg-white/5 p-10">
        <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
          Abteilung
        </p>

        <h1 className="mt-4 text-5xl font-black md:text-7xl">Tischtennis</h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-white/70">
          Hier entsteht der Bereich der Tischtennisabteilung der DJK/VfL
          Giesenkirchen 05/09 e.V. mit Informationen zu Trainingszeiten,
          Mannschaften, Ansprechpartnern und aktuellen Neuigkeiten.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {areas.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 font-bold transition hover:border-red-500 hover:bg-white/10">{label}</Link>
          ))}
        </div>
      </section>
    </main>
  );
}
