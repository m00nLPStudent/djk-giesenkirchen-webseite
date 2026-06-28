import TeamExternalEmbed from "./TeamExternalEmbed";
import {
  getMatchWidgetUrl,
  getTableWidgetUrl,
  isTableRelevantTeam,
} from "./teamCompetition.helpers";

export default function TeamCompetitionSection({ team }) {
  const showTable = isTableRelevantTeam(team);
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
          Hier werden automatisch das letzte Spiel und die nächsten drei Spiele angezeigt.
          Ab der D-Jugend wird zusätzlich die aktuelle Tabelle eingebunden.
        </p>
      </div>

      <div className={`grid gap-6 ${showTable ? "xl:grid-cols-2" : ""}`}>
        <TeamExternalEmbed
          title="Spielplan"
          description="Letztes Spiel und die nächsten drei Spiele dieser Mannschaft."
          url={matchUrl}
          emptyText="Für diese Mannschaft ist noch kein Spielplan von fussball.de/DFB hinterlegt."
        />

        {showTable && (
          <TeamExternalEmbed
            title="Tabelle"
            description="Aktuelle Tabelle der jeweiligen Staffel."
            url={tableUrl}
            emptyText="Für diese Mannschaft ist noch keine Tabelle von fussball.de/DFB hinterlegt."
          />
        )}
      </div>
    </section>
  );
}
