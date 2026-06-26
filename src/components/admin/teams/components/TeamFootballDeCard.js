import { Trophy, Link2 } from "lucide-react";

export default function TeamFootballDeCard({
  teamId = "",
  competitionId = "",
  tableAvailable = false,
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-500/20 text-yellow-400">
          <Trophy size={24} />
        </div>

        <div>
          <h2 className="text-2xl font-black">Fußball.de</h2>
          <p className="text-sm text-white/50">
            Verknüpfung zur offiziellen Spielbetriebsverwaltung
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm uppercase tracking-[0.25em] text-white/40">
            Team-ID
          </p>

          <p className="mt-2 font-bold">{teamId || "Noch nicht hinterlegt"}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm uppercase tracking-[0.25em] text-white/40">
            Wettbewerbs-ID
          </p>

          <p className="mt-2 font-bold">
            {competitionId || "Noch nicht hinterlegt"}
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
          <Link2
            className={tableAvailable ? "text-green-400" : "text-yellow-400"}
            size={22}
          />

          <p className="font-bold">
            {tableAvailable
              ? "Fußball.de verbunden"
              : "Noch keine Verbindung eingerichtet"}
          </p>
        </div>
      </div>
    </section>
  );
}
