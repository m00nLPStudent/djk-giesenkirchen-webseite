import TeamTrainingInfo from "./TeamTrainingInfo";
import TeamCompetitionSection from "./TeamCompetitionSection";
import TeamCoachSection from "./TeamCoachSection";
import TeamPlayerSection from "./TeamPlayerSection";
import TeamContact from "./TeamContact";
import TeamSectionTabs from "./TeamSectionTabs";

export default function TeamDetailTabs({
  team,
  coaches = [],
  players = [],
  teamSlug,
}) {
  const tabs = [
    { id: "training", label: "Training", content: <TeamTrainingInfo team={team} /> },
    { id: "players", label: "Kader", content: <TeamPlayerSection players={players} teamSlug={teamSlug} /> },
    { id: "staff", label: "Trainer", content: <TeamCoachSection coaches={coaches} /> },
    { id: "competition", label: "Spielbetrieb", content: <TeamCompetitionSection team={team} /> },
    { id: "contact", label: "Kontakt", content: <TeamContact team={team} /> },
  ];
  return <TeamSectionTabs tabs={tabs} initialTab="training" />;
}
