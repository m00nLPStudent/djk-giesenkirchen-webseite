import TeamExternalEmbed from "./TeamExternalEmbed";
import {
  getMatchWidgetUrl,
  getTableWidgetUrl,
  getTeamSourceUrl,
  isTableRelevantTeam,
} from "./teamCompetition.helpers";

export default function TeamCompetitionSection({ team }) {
  const showTable = isTableRelevantTeam(team);
  const sourceUrl = getTeamSourceUrl(team);
  const matchUrl = getMatchWidgetUrl(team);
  const tableUrl = getTableWidgetUrl(team);

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
        <TeamExternalEmbed
          title="Spielplan"
          description="Letztes Spiel und die nächsten drei Spiele dieser Mannschaft."
          url={matchUrl}
          sourceUrl={sourceUrl}
          emptyText="Es ist ein normaler fussball.de-Link hinterlegt, aber noch keine echte Spielplan-Widget-URL. Deshalb wird die komplette Webseite nicht mehr eingebettet."
        />

        {showTable && (
          <TeamExternalEmbed
            title="Tabelle"
            description="Aktuelle Tabelle der jeweiligen Staffel."
            url={tableUrl}
            sourceUrl={sourceUrl}
            emptyText="Es ist ein normaler fussball.de-Link hinterlegt, aber noch keine echte Tabellen-Widget-URL. Deshalb wird die komplette Webseite nicht mehr eingebettet."
          />
        )}
      </div>
    </section>
  );
}
