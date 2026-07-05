import TeamContact from "./TeamContact";
import TeamTrainingInfo from "./TeamTrainingInfo";

export default function TeamInfoGrid({ team }) {
  return (
    <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
      <TeamTrainingInfo team={team} />
      <TeamContact team={team} />
    </section>
  );
}
