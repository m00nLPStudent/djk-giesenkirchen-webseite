export default function TeamIntroCard({ team }) {
  return (
    <section className="min-w-0 rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-6 md:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
        Fußballabteilung
      </p>

      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
        <div className="min-w-0">
          <h1 className="break-words text-3xl font-black leading-tight md:text-5xl">
            {team?.name_de}
          </h1>
          <p className="mt-5 max-w-4xl break-words text-base leading-7 text-white/70 md:text-lg md:leading-8">
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
