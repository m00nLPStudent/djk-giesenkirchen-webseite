import { CalendarDays, Clock, Trophy } from "lucide-react";

export default function DashboardToday() {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400">
          <CalendarDays size={24} />
        </div>

        <div>
          <h2 className="text-2xl font-black">Heute im Verein</h2>
          <p className="text-sm text-white/50">
            Trainings, Spiele und wichtige Termine
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
          <Clock className="text-red-400" size={22} />

          <div>
            <p className="font-bold">Keine Termine vorhanden</p>
            <p className="text-sm text-white/50">
              Für heute sind aktuell keine Termine eingetragen.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
          <Trophy className="text-yellow-400" size={22} />

          <div>
            <p className="font-bold">Keine Spiele heute</p>
            <p className="text-sm text-white/50">
              Die nächsten Spiele werden hier automatisch angezeigt.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
