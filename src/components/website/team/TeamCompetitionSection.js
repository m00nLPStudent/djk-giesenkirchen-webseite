import { FupaWidget } from "@/components/website/fupa";
import { isTableRelevantTeam } from "./teamCompetition.helpers";

export default function TeamCompetitionSection({ team }) {
  const showTable = isTableRelevantTeam(team);

  return (
    <section className="mt-8 space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
          Spielbetrieb
        </p>
        <h2 className="mt-3 text-4xl font-black">Spiele & Tabelle</h2>
        <p className="mt-3 max-w-3xl text-white/55">
          Die offiziellen Spiele und Tabellen werden über FuPa eingebunden.
          Von Bambini bis E-Jugend wird nur der Spielplan angezeigt.
        </p>
      </div>

      <div className={`grid gap-6 ${showTable ? "xl:grid-cols-2" : ""}`}>
        <FupaWidget
          title="Spielplan"
          description="Letzte und kommende Spiele dieser Mannschaft."
          widgetId={team?.fupa_matches_widget_id}
          clubUrl={team?.fupa_club_url}
          customCss={team?.fupa_custom_css}
        />

        {showTable && (
          <FupaWidget
            title="Tabelle"
            description="Aktuelle Tabelle der jeweiligen Staffel."
            widgetId={team?.fupa_table_widget_id}
            clubUrl={team?.fupa_club_url}
            customCss={team?.fupa_custom_css}
          />
        )}
      </div>
    </section>
  );
}
