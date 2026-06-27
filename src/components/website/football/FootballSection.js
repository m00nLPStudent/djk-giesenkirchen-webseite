import FootballTeamCard from "./FootballTeamCard";

export default function FootballSection({ id, title, teams = [] }) {
  if (teams.length === 0) return null;

  return (
    <section id={id} className="mt-16 scroll-mt-32">
      <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
        Mannschaften
      </p>

      <h2 className="mt-3 text-4xl font-black">{title}</h2>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {teams.map((team) => (
          <FootballTeamCard key={team.id} team={team} />
        ))}
      </div>
    </section>
  );
}
