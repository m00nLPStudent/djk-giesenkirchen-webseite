export default function TeamTable({ rows = [], sourceUrl, error }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 md:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
        Tabelle
      </p>
      <h2 className="mt-3 text-3xl font-black">Aktuelle Staffel</h2>

      {rows.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-3xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/30 text-xs uppercase tracking-[0.2em] text-white/45">
              <tr>
                <th className="p-4">#</th>
                <th className="p-4">Mannschaft</th>
                <th className="p-4 text-center">Sp.</th>
                <th className="p-4 text-center">Tore</th>
                <th className="p-4 text-center">Pkt.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {rows.map((row) => (
                <tr key={`${row.position}-${row.team}`} className="bg-black/10">
                  <td className="p-4 font-black text-red-400">{row.position}</td>
                  <td className="p-4 font-bold text-white">{row.team}</td>
                  <td className="p-4 text-center text-white/70">{row.games}</td>
                  <td className="p-4 text-center text-white/70">
                    {row.goalsFor}:{row.goalsAgainst}
                  </td>
                  <td className="p-4 text-center font-black text-white">{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-6 text-white/55">
          <p>{error || "Es konnte noch keine Tabelle automatisch erkannt werden."}</p>
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
