import Link from "next/link";
import PlayerStatusBadge from "./PlayerStatusBadge";

export default function PlayerCard({ player }) {
  const fullName =
    `${player.first_name ?? ""} ${player.last_name ?? ""}`.trim() ||
    "Unbekannter Spieler";

  const teamName = player.teams?.name_de || "Keine Mannschaft";

  return (
    <div className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-red-500/50 hover:bg-white/10 md:grid-cols-[120px_1fr]">
      <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl bg-black/20">
        {player.photo_url ? (
          <img
            src={player.photo_url}
            alt={fullName}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-sm text-white/40">Kein Bild</span>
        )}
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white/60">
            {teamName}
          </span>

          {player.position_de && (
            <span className="rounded-full bg-red-600/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-red-400">
              {player.position_de}
            </span>
          )}

          <PlayerStatusBadge active={player.is_active} />

          {player.is_captain && (
            <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">
              Spielführer
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-4">
          {player.shirt_number && (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-2xl font-black text-white">
              {player.shirt_number}
            </div>
          )}

          <div>
            <h2 className="text-2xl font-black">{fullName}</h2>

            <p className="mt-1 text-sm text-white/45">
              {player.year_group
                ? `Jahrgang ${player.year_group}`
                : "Jahrgang nicht hinterlegt"}
              {player.strong_foot ? ` • ${player.strong_foot}` : ""}
              {player.nationality ? ` • ${player.nationality}` : ""}
            </p>
          </div>
        </div>

        {player.description_de && (
          <p className="mt-4 max-w-3xl text-white/60">
            {player.description_de}
          </p>
        )}

        <div className="mt-6">
          <Link
            href={`/admin/players/edit/${player.id}`}
            className="rounded-full border border-white/10 px-5 py-2 text-sm font-bold text-white transition hover:border-red-500"
          >
            Bearbeiten
          </Link>
        </div>
      </div>
    </div>
  );
}
