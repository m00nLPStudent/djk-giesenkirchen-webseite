import TeamPlayerCard from "./TeamPlayerCard";

export default function TeamPlayerSection({ players = [], teamSlug }) {
  if (players.length === 0) return null;

  return (
    <section className="mt-16">
      <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
        Kader
      </p>

      <h2 className="mt-3 text-4xl font-black">Unsere Spieler</h2>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {players.map((player) => (
          <TeamPlayerCard key={player.id} player={player} teamSlug={teamSlug} />
        ))}
      </div>
    </section>
  );
}
