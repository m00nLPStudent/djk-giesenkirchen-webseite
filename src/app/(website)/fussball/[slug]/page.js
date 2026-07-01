import { supabase } from "@/lib/supabase";
import {
  TeamHero,
  TeamIntroCard,
  TeamDetailTabs,
} from "@/components/website/team";

function mergeTeamSeason(team, teamSeason, season) {
  if (!teamSeason) {
    return {
      ...team,
      season: season?.name || team?.season,
      selected_season_id: season?.id || null,
    };
  }

  return {
    ...team,
    ...teamSeason,
    id: team.id,
    team_season_id: teamSeason.id,
    base_slug: team.slug,
    season: season?.name || team.season,
    selected_season_id: season?.id || null,
  };
}

function mapSeasonPlayers(assignments = []) {
  return assignments
    .map((assignment) => ({
      ...assignment.players,
      shirt_number: assignment.shirt_number ?? assignment.players?.shirt_number,
      position_de: assignment.position_de || assignment.players?.position_de,
      position_en: assignment.position_en || assignment.players?.position_en,
      is_captain: assignment.is_captain ?? assignment.players?.is_captain,
      is_active: assignment.is_active ?? assignment.players?.is_active,
      sort_order: assignment.sort_order ?? assignment.players?.sort_order,
    }))
    .filter((player) => player?.id && player.is_active !== false);
}

function mapSeasonCoaches(assignments = []) {
  return assignments
    .map((assignment) => ({
      ...assignment.coaches,
      role_de: assignment.role_de || assignment.coaches?.role_de,
      role_en: assignment.role_en || assignment.coaches?.role_en,
      is_active: assignment.is_active ?? assignment.coaches?.is_active,
      sort_order: assignment.sort_order ?? assignment.coaches?.sort_order,
    }))
    .filter((coach) => coach?.id && coach.is_active !== false);
}

export default async function TeamPage({ params }) {
  const { slug } = await params;

  const { data: seasons } = await supabase
    .from("seasons")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const seasonList = seasons || [];
  const selectedSeason = seasonList.find((season) => season.is_current) || seasonList[0] || null;

  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("slug", slug)
    .single();

  const { data: teamSeason } = selectedSeason?.id && team?.id
    ? await supabase
        .from("team_seasons")
        .select("*")
        .eq("team_id", team.id)
        .eq("season_id", selectedSeason.id)
        .maybeSingle()
    : { data: null };

  const displayTeam = mergeTeamSeason(team, teamSeason, selectedSeason);

  let coaches = [];
  let players = [];

  if (teamSeason?.id) {
    const { data: coachAssignments } = await supabase
      .from("coach_team_seasons")
      .select("*, coaches(*)")
      .eq("team_season_id", teamSeason.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    const { data: playerAssignments } = await supabase
      .from("player_team_seasons")
      .select("*, players(*)")
      .eq("team_season_id", teamSeason.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    coaches = mapSeasonCoaches(coachAssignments || []);
    players = mapSeasonPlayers(playerAssignments || []);
  }

  if (!coaches.length) {
    const { data: fallbackCoaches } = await supabase
      .from("coaches")
      .select("*")
      .eq("team_id", team?.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    coaches = fallbackCoaches || [];
  }

  if (!players.length) {
    const { data: fallbackPlayers } = await supabase
      .from("players")
      .select("*")
      .eq("team_id", team?.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("last_name", { ascending: true });

    players = fallbackPlayers || [];
  }

  return (
    <main className="min-h-screen bg-[#101014] text-white">
      <section className="px-6 pt-32 pb-24">
        <div className="mx-auto max-w-7xl space-y-8">
          <TeamHero team={displayTeam} />
          <TeamIntroCard team={displayTeam} />

          <TeamDetailTabs
            team={displayTeam}
            coaches={coaches || []}
            players={players || []}
            teamSlug={slug}
          />
        </div>
      </section>
    </main>
  );
}
