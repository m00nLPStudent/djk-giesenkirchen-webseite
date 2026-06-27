import Link from "next/link";
import PlayerStatusBadge from "./PlayerStatusBadge";

export default function PlayerCard({ player }) {
  const fullName = [player.first_name, player.last_name].filter(Boolean).join(" ") || player.name_de || "Spieler";
  const teamName = player.teams?.name_de || "Ohne Mannschaft";

  return (
    <div className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-red-500/50 hover:bg-white/10 md:grid-cols-[120px_1fr]">
      <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl bg-black/20">
        {player.image_url ? <img src={player.image_url} alt={fullName} className="h-full w-full object-cover" /> : <span className="text-sm text-white/40">Kein Bild</span>}
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-red-600/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-red-400">{player.position || "Spieler"}</span>
          <PlayerStatusBadge active={player.is_active} />
          {player.jersey_number && <span className="text-sm text-white/40">Nr. {player.jersey_number}</span>}
          <span className="text-sm text-white/40">{teamName}</span>
        </div>

        <h2 className="mt-4 text-2xl font-black">{fullName}</h2>
        <p className="mt-3 max-w-3xl text-white/60">{player.description_de || "Keine Beschreibung vorhanden."}</p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={"/admin/players/edit/" + player.id} className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white">
            Bearbeiten
          </Link>
        </div>
      </div>
    </div>
  );
}
