import Link from "next/link";
import CoachStatusBadge from "./CoachStatusBadge";

export default function CoachCard({ coach }) {
  return (
    <div className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-red-500/50 hover:bg-white/10 md:grid-cols-[180px_1fr]">
      <div className="flex h-32 items-center justify-center overflow-hidden rounded-2xl bg-white/5 p-4">
        {coach.image_url ? (
          <img
            src={coach.image_url}
            alt={coach.name}
            className="h-full w-full rounded-xl object-cover"
          />
        ) : (
          <span className="text-sm text-white/40">Kein Bild</span>
        )}
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-red-600/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-red-400">
            {coach.role || "Trainer"}
          </span>

          <CoachStatusBadge active={coach.is_active} />

          <span className="text-sm text-white/40">
            {coach.team_name || "Keine Mannschaft"}
          </span>
        </div>

        <h2 className="mt-4 text-2xl font-black">{coach.name}</h2>

        <p className="mt-3 max-w-3xl text-white/60">
          {coach.email || "Keine E-Mail hinterlegt"}
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={`/admin/coaches/edit/${coach.id}`}
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white"
          >
            Bearbeiten
          </Link>

          <Link
            href={`/trainer/${coach.slug}`}
            target="_blank"
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white"
          >
            Profil ansehen
          </Link>
        </div>
      </div>
    </div>
  );
}
