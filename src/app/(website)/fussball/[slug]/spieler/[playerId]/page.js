import Link from "next/link";
import { notFound } from "next/navigation";
import { createPlayerReadDto } from "@/components/admin/persons/playerReadDto";
import { getPlayerSeasonalReadModel } from "@/components/admin/persons/playerSeasonalReadModelRepository";
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

function joinUnique(values = []) {
  return [...new Set((values || []).filter(Boolean))].join(", ");
}

export default async function PlayerProfilePage({ params }) {
  const { slug, playerId } = await params;

  const { data: player } = await supabase
    .from("players")
    .select("id, first_name, last_name, image_url, photo_url, is_active, description_de, description_en, birthdate, joined_at, year_group, strong_foot, nationality, gender")
    .eq("id", playerId)
    .single();

  if (!player) {
    notFound();
  }

  const playerReadModel = await getPlayerSeasonalReadModel(supabase, playerId);
  const playerDto = createPlayerReadDto(player, playerReadModel);
  const playerView = {
    ...playerDto,
    first_name: playerDto.firstName,
    last_name: playerDto.lastName,
    is_active: playerDto.isActive,
    description_de: playerDto.descriptionDe,
  };
  const team = getTeam(playerView);
  const assignmentSlugs = (playerDto.assignments || [])
    .map((assignment) => assignment?.teamSlug)
    .filter(Boolean);

  if (assignmentSlugs.length > 0 && !assignmentSlugs.includes(slug)) {
    notFound();
  }

  const fullName = getFullName(playerView);
  const country = getCountry(playerDto.nationality);
  const age = calculateAge(playerDto.birthdate);
  const teamSlug = team?.slug || slug;
  const genderLabel = getGenderLabel(playerDto.gender);
  const teamLabel =
    joinUnique(playerDto.teamNames) || "Keine aktuelle Mannschaft";
  const seasonLabel = team?.season_name || "Keine aktuelle Saison";
  const positionLabel =
    joinUnique(
      (playerDto.assignments || []).map(
        (assignment) => assignment?.positionDe || assignment?.positionEn,
      ),
    ) ||
    playerDto.positionDe ||
    "-";
  const shirtNumberLabel =
    joinUnique(
      (playerDto.assignments || []).map((assignment) => assignment?.shirtNumber),
    ) ||
    playerDto.shirtNumber ||
    "-";
  const captainLabel =
    (playerDto.assignments || []).some((assignment) => assignment?.isCaptain) ||
    playerDto.isCaptain
      ? "Ja"
      : "Nein";

  const stats = [
    { label: "Rueckennummer", value: shirtNumberLabel },
    { label: "Position", value: positionLabel },
    {
      label: (playerDto.teamNames || []).length > 1 ? "Mannschaften" : "Mannschaft",
      value: teamLabel,
    },
    { label: "Saison", value: seasonLabel },
    { label: "Spielfuehrer", value: captainLabel },
    { label: "Geschlecht", value: genderLabel },
    { label: "Geburtsdatum", value: formatDate(playerDto.birthdate) },
    { label: "Alter", value: age !== null ? `${age} Jahre` : "-" },
    { label: "Jahrgang", value: playerDto.yearGroup || "-" },
    { label: "Starker Fuss", value: playerDto.strongFoot },
    { label: "Im Verein seit", value: formatDate(playerDto.joinedAt) },
  ];

  return (
    <main className="min-h-screen bg-[var(--dunkel)] text-white">
      <section className="px-6 pt-32 pb-24">
        <div className="mx-auto max-w-7xl">
          <Link
            href={`/fussball/${teamSlug}`}
            className="inline-flex rounded-full border border-white/10 px-5 py-2 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white"
          >
            Zurueck zur Mannschaft
          </Link>

          <div className="mt-10 grid gap-10 lg:grid-cols-[420px_1fr] lg:items-stretch">
            <PlayerProfileImageCard
              player={playerView}
              fullName={fullName}
              country={country}
            />

            <div className="flex h-full flex-col">
              <PlayerProfileHeader
                player={playerView}
                fullName={fullName}
                genderLabel={genderLabel}
                team={team}
              />

              <div className="mt-10 flex flex-1">
                <PlayerProfileStatsGrid stats={stats} />
              </div>

              <PlayerProfileDescription description={playerDto.descriptionEn} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
