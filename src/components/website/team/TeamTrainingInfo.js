export default function TeamTrainingInfo({ team, className = "" }) {
  return (
    <section
      className={`h-full min-w-0 rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-6 md:p-8 ${className}`}
    >
      <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
        Training
      </p>

      <h2 className="mt-3 break-words text-2xl font-black sm:text-3xl">
        Trainingsinformationen
      </h2>

      <div className="mt-8 space-y-6">
        <div className="min-w-0 rounded-3xl border border-white/10 bg-black/20 p-4 sm:p-5">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
            Trainingszeiten
          </p>
          <p className="mt-3 whitespace-pre-line break-words text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
            {team?.training_times_de || "Keine Trainingszeiten hinterlegt."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="min-w-0 rounded-3xl border border-white/10 bg-black/20 p-4 sm:p-5">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
              Saison
            </p>
            <p className="mt-2 break-words text-base font-black text-white sm:text-lg">
              {team?.season || "Keine Saison"}
            </p>
          </div>

          <div className="min-w-0 rounded-3xl border border-white/10 bg-black/20 p-4 sm:p-5">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
              Ort
            </p>
            <p className="mt-2 break-words text-base font-black text-white sm:text-lg">
              Bezirksportanlage Giesenkirchen
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
