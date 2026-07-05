import Link from "next/link";
import {
  getActiveFootballTeams,
  groupFootballTeams,
} from "@/lib/football/teams";

const GROUP_CARDS = [
  {
    key: "junioren",
    title: "Junioren",
    href: "/fussball/mannschaften/junioren",
    description:
      "Alle Jugendteams von den Bambini bis zu den A-Junioren im Überblick.",
  },
  {
    key: "senioren",
    title: "Senioren",
    href: "/fussball/mannschaften/senioren",
    description:
      "Unsere Herren- und Seniorenteams mit direktem Zugriff auf alle Teamseiten.",
  },
  {
    key: "damen",
    title: "Damen",
    href: "/fussball/mannschaften/damen",
    description: "Alle Damenmannschaften inklusive direkter Team-Links.",
  },
];

export default async function FootballTeamsOverviewPage() {
  const { data: teams = [] } = await getActiveFootballTeams();
  const groups = groupFootballTeams(teams);

  return (
    <main className="min-h-screen bg-[#101014] pt-28 pb-20 text-white md:pt-32 md:pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
            Mannschaften
          </p>
          <h1 className="mt-4 text-3xl font-black md:text-6xl">
            Unsere Mannschaften
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/65 md:text-lg md:leading-8">
            Wähle die passende Mannschaftsgruppe aus und öffne danach die
            gewünschte Teamseite.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
            {GROUP_CARDS.map((card) => (
              <Link
                key={card.key}
                href={card.href}
                className="group rounded-3xl border border-white/10 bg-black/20 p-6 transition hover:-translate-y-1 hover:border-red-500/60 hover:bg-white/10"
              >
                <p className="text-xs font-black uppercase tracking-[0.2em] text-red-400">
                  {groups[card.key]?.length || 0} Teams
                </p>
                <h2 className="mt-3 text-2xl font-black">{card.title}</h2>
                <p className="mt-3 text-sm leading-7 text-white/60">
                  {card.description}
                </p>
                <span className="mt-6 inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white/75 transition group-hover:border-red-500 group-hover:text-white">
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
