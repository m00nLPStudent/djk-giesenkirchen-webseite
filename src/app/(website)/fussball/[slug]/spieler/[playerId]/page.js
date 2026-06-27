import Link from "next/link";
import { notFound } from "next/navigation";
import { getGenderLabel } from "@/constants";
import {
  calculateAge,
  formatDate,
  getCountry,
  getFullName,
  getTeam,
  PlayerProfileDescription,
  PlayerProfileHeader,
  PlayerProfileImageCard,
  PlayerProfileStatsGrid,
} from "@/components/website/player-profile";
import { supabase } from "@/lib/supabase";

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

  const stats = [
    { label: "Rückennummer", value: player.shirt_number },
    { label: "Position", value: player.position_de },
    { label: "Mannschaft", value: team?.name_de },
    { label: "Geschlecht", value: genderLabel },
    { label: "Geburtsdatum", value: formatDate(player.birthdate) },
    { label: "Alter", value: age !== null ? `${age} Jahre` : "-" },
    { label: "Jahrgang", value: player.year_group || "-" },
    { label: "Starker Fuß", value: player.strong_foot },
    { label: "Im Verein seit", value: formatDate(player.joined_at) },
  ];

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

          <div className="mt-10 grid gap-10 lg:grid-cols-[420px_1fr] lg:items-stretch">
            <PlayerProfileImageCard
              player={player}
              fullName={fullName}
              country={country}
            />

            <div className="flex h-full flex-col">
              <PlayerProfileHeader
                player={player}
                fullName={fullName}
                genderLabel={genderLabel}
                team={team}
              />

              <div className="mt-10 flex flex-1">
                <PlayerProfileStatsGrid stats={stats} />
              </div>

              <PlayerProfileDescription description={player.description_en} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
