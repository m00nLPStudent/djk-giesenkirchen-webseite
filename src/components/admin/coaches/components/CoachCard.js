import Link from "next/link";
import { COACH_PLACEHOLDER_IMAGE } from "@/constants/images";
import { COUNTRIES } from "@/constants";
import CoachStatusBadge from "./CoachStatusBadge";

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

export default function CoachCard({ coach }) {
  const country = getCountry(coach.nationality);
  const imageUrl = coach.image_url || COACH_PLACEHOLDER_IMAGE;

  return (
    <div className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-red-500/50 hover:bg-white/10 md:grid-cols-[140px_1fr]">
      <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl bg-black/20">
        <img
          src={imageUrl}
          alt={coach.name || "Trainerbild"}
          className="h-full w-full object-cover"
        />
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

          {country && (
            <span className="inline-flex items-center gap-2 text-sm text-white/50">
              <FlagIcon country={country} />
              {country.de}
            </span>
          )}
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
