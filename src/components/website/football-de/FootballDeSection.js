import FootballDeAccordion from "./FootballDeAccordion";
import FootballDeWidget from "./FootballDeWidget";

export default function FootballDeSection({ team, showTable }) {
  return (
    <section className="mt-8 space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
          Spielbetrieb
        </p>
        <h2 className="mt-3 text-4xl font-black">Spiele & Tabelle</h2>
        <p className="mt-3 max-w-3xl text-white/55">
          Offizielle Spiele und Tabellen der Mannschaft direkt von fussball.de.
        </p>
      </div>

      <div className="space-y-4">
        <FootballDeAccordion
          title="Spielplan"
          description="Letzte und kommende Spiele dieser Mannschaft anzeigen."
        >
          <FootballDeWidget
            title="Spielplan"
            description="Letzte und kommende Spiele dieser Mannschaft."
            widgetId={team?.fussball_de_matches_widget_id}
            widgetType="team-matches"
          />
        </FootballDeAccordion>

        {showTable && (
          <FootballDeAccordion
            title="Tabelle"
            description="Aktuelle Tabelle der jeweiligen Staffel anzeigen."
          >
            <FootballDeWidget
              title="Tabelle"
              description="Aktuelle Tabelle der jeweiligen Staffel."
              widgetId={team?.fussball_de_table_widget_id}
              widgetType="table"
            />
          </FootballDeAccordion>
        )}
      </div>
    </section>
  );
}
