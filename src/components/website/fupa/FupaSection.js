import FupaWidget from "./FupaWidget";

export default function FupaSection({ team, showTable }) {
  return (
    <section className="mt-8 space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
          Spielbetrieb
        </p>
        <h2 className="mt-3 text-4xl font-black">Spiele & Tabelle</h2>
        <p className="mt-3 max-w-3xl text-white/55">
          Offizielle Spiele und Tabellen der Mannschaft im einheitlichen Vereinsdesign.
        </p>
      </div>

      <div className={`grid items-stretch gap-6 ${showTable ? "xl:grid-cols-2" : ""}`}>
        <FupaWidget
          title="Spielplan"
          description="Letzte und kommende Spiele dieser Mannschaft."
          widgetId={team?.fupa_matches_widget_id}
          clubUrl={team?.fupa_club_url}
        />

        {showTable && (
          <FupaWidget
            title="Tabelle"
            description="Aktuelle Tabelle der jeweiligen Staffel."
            widgetId={team?.fupa_table_widget_id}
            clubUrl={team?.fupa_club_url}
          />
        )}
      </div>
    </section>
  );
}
