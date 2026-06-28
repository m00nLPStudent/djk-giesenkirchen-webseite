export default function TeamIntroCard({ team }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 md:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
        Fußballabteilung
      </p>

      <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_280px] lg:items-end">
        <div>
          <h1 className="text-4xl font-black md:text-5xl">{team?.name_de}</h1>
          <p className="mt-5 max-w-4xl text-base leading-8 text-white/70 md:text-lg">
            {team?.description_de || "Mannschaftsbeschreibung folgt."}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
            Saison
          </p>
          <p className="mt-2 text-2xl font-black text-white">
            {team?.season || "Keine Saison"}
          </p>
        </div>
      </div>
    </section>
  );
}
