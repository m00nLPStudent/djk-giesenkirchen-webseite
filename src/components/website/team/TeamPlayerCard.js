import { PLAYER_PLACEHOLDER_IMAGE } from "@/constants/images";

export default function TeamPlayerCard({ player }) {
  const fullName =
    `${player.first_name ?? ""} ${player.last_name ?? ""}`.trim() ||
    "Unbekannter Spieler";

  const imageUrl = player.photo_url || PLAYER_PLACEHOLDER_IMAGE;

  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      <div className="relative flex h-72 items-center justify-center bg-black/20">
        <img src={imageUrl} alt={fullName} className="h-full w-full object-cover" />

        {player.shirt_number && (
          <div className="absolute left-4 top-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-2xl font-black text-white shadow-xl">
            {player.shirt_number}
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="flex flex-wrap items-center gap-2">
          {player.position_de && (
            <span className="rounded-full bg-red-600/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-red-400">
              {player.position_de}
            </span>
          )}

          {player.is_captain && (
            <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">
              Spielführer
            </span>
          )}
        </div>

        <h3 className="mt-4 text-2xl font-black">{fullName}</h3>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/50">
          {player.year_group && <span>Jahrgang {player.year_group}</span>}
          {player.strong_foot && <span>• {player.strong_foot}</span>}
        </div>
      </div>
    </article>
  );
}
