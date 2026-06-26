import Link from "next/link";
import TeamStatusBadge from "./TeamStatusBadge";

export default function TeamCard({ team }) {
  return (
    <div className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-red-500/50 hover:bg-white/10 md:grid-cols-[180px_1fr]">
      <div className="flex h-32 items-center justify-center overflow-hidden rounded-2xl bg-white/5 p-4">
        {team.team_image_url ? (
          <img
            src={team.team_image_url}
            alt={team.name_de}
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="text-sm text-white/40">Kein Bild</span>
        )}
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-red-600/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-red-400">
            {team.age_group || "Mannschaft"}
          </span>

          <TeamStatusBadge active={team.is_active} />

          <span className="text-sm text-white/40">
            Saison {team.season || "—"}
          </span>

          <span className="text-sm text-white/40">
            Reihenfolge: {team.sort_order ?? 0}
          </span>
        </div>

        <h2 className="mt-4 text-2xl font-black">{team.name_de}</h2>

        <p className="mt-3 max-w-3xl text-white/60">
          {team.description_de || "Keine Beschreibung vorhanden."}
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={`/admin/teams/edit/${team.id}`}
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white"
          >
            Bearbeiten
          </Link>

          <Link
            href={`/fussball/${team.slug}`}
            target="_blank"
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white"
          >
            Ansehen
          </Link>
        </div>
      </div>
    </div>
  );
}
