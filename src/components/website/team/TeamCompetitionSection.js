import { FootballDeSection } from "@/components/website/football-de";
import { isTableRelevantTeam } from "./teamCompetition.helpers";

export default function TeamCompetitionSection({ team }) {
  return <FootballDeSection team={team} showTable={isTableRelevantTeam(team)} />;
}
