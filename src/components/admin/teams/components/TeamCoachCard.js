import { UserRound } from "lucide-react";

export default function TeamCoachCard({
  coach = "Nicht zugewiesen",
  assistantCoach = "Nicht zugewiesen",
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/20 text-red-400">
          <UserRound size={24} />
        </div>

        <div>
          <h2 className="text-2xl font-black">Trainerteam</h2>
          <p className="text-sm text-white/50">
            Verantwortliche der Mannschaft
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm uppercase tracking-[0.25em] text-white/40">
            Cheftrainer
          </p>

          <h3 className="mt-2 text-xl font-bold">{coach}</h3>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm uppercase tracking-[0.25em] text-white/40">
            Co-Trainer
          </p>

          <h3 className="mt-2 text-xl font-bold">{assistantCoach}</h3>
        </div>
      </div>
    </section>
  );
}
