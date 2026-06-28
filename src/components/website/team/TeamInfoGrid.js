import TeamContact from "./TeamContact";
import TeamTrainingInfo from "./TeamTrainingInfo";

export default function TeamInfoGrid({ team }) {
  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <TeamTrainingInfo team={team} />
      <TeamContact team={team} />
    </section>
  );
}
