import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminTeamsList, TeamStats } from "@/components/admin/teams";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default async function AdminTeamsPage() {
  const { data: teams } = await supabase
    .from("teams")
    .select("*")
    .order("sort_order", { ascending: true });

  const { data: players } = await supabase
    .from("players")
    .select("id, team_id, is_active");

  const { data: coaches } = await supabase
    .from("coaches")
    .select("id, team_id, is_active");

  const teamList = teams || [];
  const playerList = players || [];
  const coachList = coaches || [];

  const teamsWithCounts = teamList.map((team) => ({
    ...team,
    players_count: playerList.filter(
      (player) => player.team_id === team.id && player.is_active,
    ).length,
    coaches_count: coachList.filter(
      (coach) => coach.team_id === team.id && coach.is_active,
    ).length,
  }));

  const active = teamList.filter((team) => team.is_active).length;
  const inactive = teamList.filter((team) => !team.is_active).length;
  const footballDeReady = teamList.filter(
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
