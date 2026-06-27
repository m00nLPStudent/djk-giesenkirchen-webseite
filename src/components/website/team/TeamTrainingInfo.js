export default function TeamTrainingInfo({ team }) {
  return (
    <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8">
      <h2 className="text-3xl font-black">Trainingsinformationen</h2>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-red-400">
            Training
          </p>

          <p className="mt-2 whitespace-pre-line text-lg">
            {team?.training_times_de || "Keine Trainingszeiten hinterlegt."}
          </p>
        </div>

        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-red-400">
            Saison
          </p>

          <p className="mt-2 text-lg">{team?.season || "Keine Saison"}</p>
        </div>

        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-red-400">
            Ort
          </p>

          <p className="mt-2 text-lg">Bezirksportanlage Giesenkirchen</p>
        </div>
      </div>
    </div>
  );
}
