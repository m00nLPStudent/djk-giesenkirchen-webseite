import { fetchFussballDeCompetitionData } from "@/lib/fussball-de/fussballDe.server";
import TeamMatchList from "./TeamMatchList";
import TeamTable from "./TeamTable";
import { getTeamSourceUrl, isTableRelevantTeam } from "./teamCompetition.helpers";

export default async function TeamCompetitionSection({ team }) {
  const showTable = isTableRelevantTeam(team);
  const sourceUrl = getTeamSourceUrl(team);
  const data = await fetchFussballDeCompetitionData(sourceUrl, {
    includeTable: showTable,
  });

  return (
    <section className="mt-8 space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
          Spielbetrieb
        </p>
        <h2 className="mt-3 text-4xl font-black">Spiele & Tabelle</h2>
        <p className="mt-3 max-w-3xl text-white/55">
          Hier werden das letzte Spiel und die nächsten drei Spiele angezeigt.
          Ab der D-Jugend wird zusätzlich die aktuelle Tabelle eingebunden.
        </p>
      </div>

      <div className={`grid gap-6 ${showTable ? "xl:grid-cols-2" : ""}`}>
        <TeamMatchList
          matches={data.matches}
          sourceUrl={data.sourceUrl}
          error={data.error}
        />

        {showTable && (
          <TeamTable
            rows={data.table}
            sourceUrl={data.sourceUrl}
            error={data.error}
          />
        )}
      </div>
    </section>
  );
}
