import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminTeamsList, TeamStats } from "@/components/admin/teams";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

function mergeTeamSeason(team, teamSeason, season) {
  if (!teamSeason) {
    return {
      ...team,
      season: season?.name || team.season,
      public_season_name: season?.name || team.season,
    };
  }

  return {
    ...team,
    ...teamSeason,
    id: team.id,
    base_slug: team.slug,
    season: season?.name || team.season,
    public_season_name: season?.name || team.season,
  };
}

export default async function AdminTeamsPage() {
  const { data: teams } = await supabase
    .from("teams")
    .select("*")
    .order("sort_order", { ascending: true });

  const { data: seasons } = await supabase
    .from("seasons")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const publicSeason = (seasons || []).find((season) => season.is_current) || seasons?.[0] || null;

  const teamIds = (teams || []).map((team) => team.id);

  const { data: teamSeasons } = teamIds.length
    ? await supabase
        .from("team_seasons")
        .select("*")
        .in("team_id", teamIds)
        .eq("season_id", publicSeason?.id)
    : { data: [] };

  const teamSeasonIds = (teamSeasons || []).map((teamSeason) => teamSeason.id);

  const { data: playerAssignments } = teamSeasonIds.length
    ? await supabase
        .from("player_team_seasons")
        .select("id, team_season_id, is_active")
        .in("team_season_id", teamSeasonIds)
    : { data: [] };

  const { data: coachAssignments } = teamSeasonIds.length
    ? await supabase
        .from("coach_team_seasons")
        .select("id, team_season_id, is_active")
        .in("team_season_id", teamSeasonIds)
    : { data: [] };

  const teamList = teams || [];
  const teamSeasonList = teamSeasons || [];
  const playerList = playerAssignments || [];
  const coachList = coachAssignments || [];

  const teamsWithCounts = teamList.map((team) => {
    const teamSeason = teamSeasonList.find((item) => item.team_id === team.id);
    const displayTeam = mergeTeamSeason(team, teamSeason, publicSeason);

    return {
      ...displayTeam,
      players_count: playerList.filter(
        (player) => player.team_season_id === teamSeason?.id && player.is_active,
      ).length,
      coaches_count: coachList.filter(
        (coach) => coach.team_season_id === teamSeason?.id && coach.is_active,
      ).length,
    };
  });

  const active = teamList.filter((team) => team.is_active).length;
  const inactive = teamList.filter((team) => !team.is_active).length;
  const footballDeReady = teamsWithCounts.filter(
    (team) => team.fussball_de_matches_widget_id || team.fussball_de_table_widget_id,
  ).length;

  return (
    <AdminLayout title="Mannschaften verwalten" subtitle="Adminbereich">
      <div className="mb-8 flex justify-end">
        <Link
          href="/admin/teams/new"
          className="rounded-full bg-red-600 px-6 py-3 font-bold transition hover:bg-red-700"
        >
          Neue Mannschaft
        </Link>
      </div>

      <TeamStats
        total={teamList.length}
        active={active}
        inactive={inactive}
        footballDeReady={footballDeReady}
      />

      <AdminTeamsList teams={teamsWithCounts} />
    </AdminLayout>
  );
}
