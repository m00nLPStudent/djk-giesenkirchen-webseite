function MatchRow({ match, index }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-red-400">
            {[match.date, match.time].filter(Boolean).join(" · ") || "Termin offen"}
          </p>
          <p className="mt-2 text-lg font-black text-white">
            {match.homeTeam || "Heimteam"}
            <span className="mx-2 text-white/35">vs.</span>
            {match.awayTeam || "Gastteam"}
          </p>
        </div>

        {match.score && (
          <div className="rounded-2xl bg-red-600 px-4 py-2 text-xl font-black text-white">
            {match.score}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TeamMatchList({ matches = [], sourceUrl, error }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 md:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
        Spielplan
      </p>
      <h2 className="mt-3 text-3xl font-black">Letztes & nächste Spiele</h2>

      {matches.length > 0 ? (
        <div className="mt-6 space-y-3">
          {matches.map((match, index) => (
            <MatchRow key={`${match.raw}-${index}`} match={match} index={index} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-6 text-white/55">
          <p>{error || "Es konnten noch keine Spiele automatisch erkannt werden."}</p>
          {sourceUrl && (
            <a className="mt-5 inline-flex rounded-full border border-white/10 px-5 py-3 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white" href={sourceUrl}>
              Offizielle fussball.de-Seite öffnen
            </a>
          )}
        </div>
      )}
    </section>
  );
}
