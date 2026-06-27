import Link from "next/link";
import { COUNTRIES } from "@/constants";
import { PLAYER_PLACEHOLDER_IMAGE } from "@/constants/images";

function getCountry(value) {
  if (!value) return null;

  const normalizedValue = String(value).trim().toLowerCase();

  return (
    COUNTRIES.find((country) => {
      return (
        country.iso.toLowerCase() === normalizedValue ||
        country.de.toLowerCase() === normalizedValue ||
        country.en.toLowerCase() === normalizedValue
      );
    }) || null
  );
}

function FlagIcon({ country }) {
  if (!country || country.iso === "OTHER") return null;

  return (
    <img
      src={`https://flagcdn.com/w40/${country.iso.toLowerCase()}.png`}
      alt={country.de}
      className="h-4 w-6 rounded-sm object-cover ring-1 ring-white/20"
    />
  );
}

export default function TeamPlayerCard({ player, teamSlug }) {
  const fullName =
    `${player.first_name ?? ""} ${player.last_name ?? ""}`.trim() ||
    "Unbekannter Spieler";

  const country = getCountry(player.nationality);
  const imageUrl = player.photo_url || PLAYER_PLACEHOLDER_IMAGE;

  return (
    <Link
      href={`/fussball/${teamSlug}/spieler/${player.id}`}
      className="group block overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition hover:-translate-y-1 hover:border-red-500/50 hover:bg-white/10"
    >
      <div className="relative flex h-72 items-center justify-center bg-black/20">
        <img
          src={imageUrl}
          alt={fullName}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

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
          {country && (
            <span className="inline-flex items-center gap-2">
              <span>•</span>
              <FlagIcon country={country} />
              <span>{country.de}</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
