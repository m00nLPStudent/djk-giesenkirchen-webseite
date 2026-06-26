import { MapPin, Clock } from "lucide-react";

export default function TeamTrainingCard({
  trainingTimes = "Keine Trainingszeiten hinterlegt",
  location = "Bezirksportanlage Giesenkirchen",
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400">
          <Clock size={24} />
        </div>

        <div>
          <h2 className="text-2xl font-black">Training</h2>
          <p className="text-sm text-white/50">Trainingszeiten und Ort</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm uppercase tracking-[0.25em] text-white/40">
            Zeiten
          </p>

          <p className="mt-2 whitespace-pre-line text-lg font-bold">
            {trainingTimes}
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
          <MapPin className="text-red-400" size={22} />

          <p className="font-bold">{location}</p>
        </div>
      </div>
    </section>
  );
}
