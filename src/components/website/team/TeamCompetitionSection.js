import { FupaSection } from "@/components/website/fupa";
import { isTableRelevantTeam } from "./teamCompetition.helpers";

export default function TeamCompetitionSection({ team }) {
  return <FupaSection team={team} showTable={isTableRelevantTeam(team)} />;
}
