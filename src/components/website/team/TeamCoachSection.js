import TeamCoachCard from "./TeamCoachCard";

export default function TeamCoachSection({ coaches = [] }) {
  if (coaches.length === 0) return null;

  return (
    <section className="mt-16">
      <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
        Trainerteam
      </p>

      <h2 className="mt-3 text-4xl font-black">Unser Trainerteam</h2>

      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {coaches.map((coach) => (
          <TeamCoachCard key={coach.id} coach={coach} />
        ))}
      </div>
    </section>
  );
}
