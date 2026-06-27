import Link from "next/link";
import { COUNTRIES, getGenderLabel } from "@/constants";
import { PLAYER_PLACEHOLDER_IMAGE } from "@/constants/images";
import PlayerStatusBadge from "./PlayerStatusBadge";

function getNationality(value) {
  if (!value) return null;

  const normalizedValue = String(value).trim().toLowerCase();

  return (
    COUNTRIES.find((item) => {
      return (
        item.iso.toLowerCase() === normalizedValue ||
        item.de.toLowerCase() === normalizedValue ||
        item.en.toLowerCase() === normalizedValue
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

export default function PlayerCard({ player }) {
  const fullName =
    `${player.first_name ?? ""} ${player.last_name ?? ""}`.trim() ||
    "Unbekannter Spieler";

  const teamName = player.teams?.name_de || "Keine Mannschaft";
  const teamSlug = player.teams?.slug;
  const nationality = getNationality(player.nationality);
  const genderLabel = getGenderLabel(player.gender);
  const profileUrl = teamSlug ? `/fussball/${teamSlug}/spieler/${player.id}` : null;
  const imageUrl = player.photo_url || PLAYER_PLACEHOLDER_IMAGE;

  return (
    <div className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-red-500/50 hover:bg-white/10 md:grid-cols-[120px_1fr]">
      <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl bg-black/20">
        <img
          src={imageUrl}
          alt={fullName}
          className="h-full w-full object-cover"
        />
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

          {genderLabel && (
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white/60">
              {genderLabel}
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

            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/45">
              <span>
                {player.year_group
                  ? `Jahrgang ${player.year_group}`
                  : "Jahrgang nicht hinterlegt"}
              </span>

              {player.strong_foot && <span>• {player.strong_foot}</span>}

              {nationality && (
                <span className="inline-flex items-center gap-2">
                  <span>•</span>
                  <FlagIcon country={nationality} />
                  <span>{nationality.de}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {player.description_de && (
          <p className="mt-4 max-w-3xl text-white/60">
            {player.description_de}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/admin/players/edit/${player.id}`}
            className="rounded-full border border-white/10 px-5 py-2 text-sm font-bold text-white transition hover:border-red-500"
          >
            Bearbeiten
          </Link>

          {profileUrl && (
            <Link
              href={profileUrl}
              target="_blank"
              className="rounded-full bg-red-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-red-700"
            >
              Profil anzeigen
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
