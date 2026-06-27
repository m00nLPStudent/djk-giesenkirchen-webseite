import TeamCoachCard from "./TeamCoachCard";

export default function TeamCoachSection({ coaches = [] }) {
  if (coaches.length === 0) return null;

  const trainer = coaches.filter((coach) => coach.role === "Trainer");

  const coTrainer = coaches.filter((coach) => coach.role === "Co-Trainer");

  const betreuer = coaches.filter((coach) => coach.role === "Betreuer");

  const goalkeeper = coaches.filter((coach) => coach.role === "Torwarttrainer");

  const sections = [
    {
      title: "Trainer",
      data: trainer,
    },
    {
      title: "Co-Trainer",
      data: coTrainer,
    },
    {
      title: "Betreuer",
      data: betreuer,
    },
    {
      title: "Torwarttrainer",
      data: goalkeeper,
    },
  ];

  return (
    <section className="mt-16">
      <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
        Trainerteam
      </p>

      <h2 className="mt-3 text-4xl font-black">Unser Trainerteam</h2>

      {sections.map((section) => {
        if (section.data.length === 0) return null;

        return (
          <div key={section.title} className="mt-10">
            <h3 className="mb-6 text-2xl font-black">{section.title}</h3>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {section.data.map((coach) => (
                <TeamCoachCard key={coach.id} coach={coach} />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
