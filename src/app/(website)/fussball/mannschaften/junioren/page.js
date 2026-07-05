import Link from "next/link";
import { FootballTeamCard } from "@/components/website/football";
import {
  getActiveFootballTeams,
  groupFootballTeams,
} from "@/lib/football/teams";

export default async function FootballJuniorTeamsPage() {
  const { data: teams = [] } = await getActiveFootballTeams();
  const grouped = groupFootballTeams(teams);
  const juniorTeams = grouped.junioren;

  return (
    <main className="min-h-screen bg-[#101014] pt-28 pb-20 text-white md:pt-32 md:pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
            Mannschaften
          </p>
          <h1 className="mt-4 text-3xl font-black md:text-6xl">Junioren</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/65 md:text-lg md:leading-8">
            Alle Jugendmannschaften der Fußballabteilung in einer Übersicht.
          </p>
          <Link
            href="/fussball/mannschaften"
            className="mt-6 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-white/80 transition hover:border-red-500 hover:text-white"
          >
            Zurück zur Mannschaftsübersicht
          </Link>
        </section>

        {juniorTeams.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-8">
            <p className="text-white/65">
              Aktuell sind keine Junioren-Mannschaften veröffentlicht.
            </p>
          </section>
        ) : (
          <section className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {juniorTeams.map((team) => (
              <FootballTeamCard key={team.id} team={team} />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
