import Link from "next/link";
import { notFound } from "next/navigation";
import { COUNTRIES, getGenderLabel } from "@/constants";
import { PLAYER_PLACEHOLDER_IMAGE } from "@/constants/images";
import { supabase } from "@/lib/supabase";

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

function getTeam(player) {
  if (Array.isArray(player?.teams)) return player.teams[0] || null;
  return player?.teams || null;
}

function FlagIcon({ country }) {
  if (!country || country.iso === "OTHER") return null;

  return (
    <img
      src={`https://flagcdn.com/w80/${country.iso.toLowerCase()}.png`}
      alt={country.de}
      className="h-7 w-11 shrink-0 rounded-md object-cover ring-1 ring-white/20"
    />
  );
}

function calculateAge(birthdate) {
  if (!birthdate) return null;

  const birthday = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birthday.getFullYear();
  const monthDiff = today.getMonth() - birthday.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
    age = age - 1;
  }

  return age;
}

function formatDate(date) {
  if (!date) return "Nicht hinterlegt";

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function getFullName(player) {
  return `${player.first_name ?? ""} ${player.last_name ?? ""}`.trim();
}

function ProfileStat({ label, value, children }) {
  return (
    <div className="min-h-32 rounded-3xl border border-white/10 bg-white/5 p-6">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
        {label}
      </p>
      <div className="mt-3 break-words text-2xl font-black leading-tight text-white">
        {children || value || "-"}
      </div>
    </div>
  );
}

function NationalityBox({ country, fallback }) {
  return (
    <div className="border-t border-white/10 p-6">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
        Nationalität
      </p>
      <div className="mt-3 flex min-w-0 items-center gap-3 text-2xl font-black leading-tight text-white">
        {country ? (
          <>
            <FlagIcon country={country} />
            <span className="min-w-0 break-words">{country.de}</span>
          </>
        ) : (
          fallback || "-"
        )}
      </div>
    </div>
  );
}

export default async function PlayerProfilePage({ params }) {
  const { slug, playerId } = await params;

  const { data: player } = await supabase
    .from("players")
    .select("*, teams(id, name_de, slug, age_group, training_times_de)")
    .eq("id", playerId)
    .single();

  if (!player) {
    notFound();
  }

  const team = getTeam(player);

  if (team?.slug && team.slug !== slug) {
    notFound();
  }

  const fullName = getFullName(player);
  const country = getCountry(player.nationality);
  const age = calculateAge(player.birthdate);
  const teamSlug = team?.slug || slug;
  const genderLabel = getGenderLabel(player.gender);
  const imageUrl = player.photo_url || PLAYER_PLACEHOLDER_IMAGE;

  return (
    <main className="min-h-screen bg-[#101014] text-white">
      <section className="px-6 pt-32 pb-24">
        <div className="mx-auto max-w-7xl">
          <Link
            href={`/fussball/${teamSlug}`}
            className="inline-flex rounded-full border border-white/10 px-5 py-2 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white"
          >
            Zurück zur Mannschaft
          </Link>

          <div className="mt-10 grid gap-10 lg:grid-cols-[420px_1fr] lg:items-start">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
              <div className="relative flex h-[520px] items-center justify-center bg-black/20">
                <img
                  src={imageUrl}
                  alt={fullName}
                  className="h-full w-full object-cover"
                />

                {player.shirt_number && (
                  <div className="absolute left-6 top-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-600 text-4xl font-black shadow-2xl">
                    {player.shirt_number}
                  </div>
                )}
              </div>

              <NationalityBox country={country} fallback={player.nationality} />
            </div>

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
                Spielerprofil
              </p>

              <h1 className="mt-5 text-5xl font-black md:text-7xl">
                {fullName}
              </h1>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {player.position_de && (
                  <span className="rounded-full bg-red-600/20 px-4 py-2 text-sm font-bold uppercase tracking-[0.25em] text-red-400">
                    {player.position_de}
                  </span>
                )}

                {genderLabel && (
                  <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold uppercase tracking-[0.25em] text-white/60">
                    {genderLabel}
                  </span>
                )}

                {player.is_captain && (
                  <span className="rounded-full bg-yellow-500/20 px-4 py-2 text-sm font-bold uppercase tracking-[0.25em] text-yellow-400">
                    Spielführer
                  </span>
                )}

                <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold uppercase tracking-[0.25em] text-white/60">
                  {team?.name_de || "Keine Mannschaft"}
                </span>
              </div>

              {!player.is_active && (
                <div className="mt-6 rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-5 text-yellow-200">
                  Dieser Spieler ist aktuell im Adminbereich deaktiviert und wird öffentlich normalerweise nicht im Kader angezeigt.
                </div>
              )}

              {player.description_de && (
                <p className="mt-8 max-w-3xl text-lg leading-8 text-white/70">
                  {player.description_de}
                </p>
              )}

              <div className="mt-10 grid auto-rows-fr gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <ProfileStat label="Rückennummer" value={player.shirt_number} />
                <ProfileStat label="Position" value={player.position_de} />
                <ProfileStat label="Mannschaft" value={team?.name_de} />
                <ProfileStat label="Geschlecht" value={genderLabel} />
                <ProfileStat label="Geburtsdatum" value={formatDate(player.birthdate)} />
                <ProfileStat label="Alter" value={age !== null ? `${age} Jahre` : "-"} />
                <ProfileStat label="Jahrgang" value={player.year_group || "-"} />
                <ProfileStat label="Starker Fuß" value={player.strong_foot} />
                <ProfileStat label="Im Verein seit" value={formatDate(player.joined_at)} />
              </div>

              {player.description_en && (
                <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
                    Beschreibung Englisch
                  </p>
                  <p className="mt-4 leading-7 text-white/70">{player.description_en}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
