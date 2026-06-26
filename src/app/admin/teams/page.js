import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminTeamsList, TeamStats } from "@/components/admin/teams";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default async function AdminTeamsPage() {
  const { data: teams } = await supabase
    .from("teams")
    .select("*")
    .order("sort_order", { ascending: true });

  const { data: players } = await supabase.from("players").select("is_active");

  const { count: playersCount } = await supabase
    .from("players")
    .select("*", { count: "exact", head: true });

  const teamList = teams || [];

  const playerList = players || [];

  const activePlayers = playerList.filter((player) => player.is_active).length;

  const inactivePlayers = playerList.filter(
    (player) => !player.is_active,
  ).length;

  const active = teamList.filter((team) => team.is_active).length;
  const inactive = teamList.filter((team) => !team.is_active).length;

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
        activePlayers={activePlayers}
        inactivePlayers={inactivePlayers}
        openPayments={0}
      />

      <AdminTeamsList teams={teamList} />
    </AdminLayout>
  );
}
