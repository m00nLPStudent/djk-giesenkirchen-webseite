export default function TeamTrainingInfo({ team, className = "" }) {
  return (
    <section className={`h-full rounded-[2rem] border border-white/10 bg-white/5 p-6 md:p-8 ${className}`}>
      <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
        Training
      </p>

      <h2 className="mt-3 text-3xl font-black">Trainingsinformationen</h2>

      <div className="mt-8 space-y-6">
        <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
            Trainingszeiten
          </p>
          <p className="mt-3 whitespace-pre-line text-lg leading-8 text-white/80">
            {team?.training_times_de || "Keine Trainingszeiten hinterlegt."}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
              Saison
            </p>
            <p className="mt-2 text-lg font-black text-white">
              {team?.season || "Keine Saison"}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
              Ort
            </p>
            <p className="mt-2 text-lg font-black text-white">
              Bezirksportanlage Giesenkirchen
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
