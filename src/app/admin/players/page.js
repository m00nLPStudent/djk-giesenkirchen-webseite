import Link from "next/link";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminPlayersList, PlayerStats } from "@/components/admin/players";
import PlayerNationalityList from "@/components/admin/players/stats/PlayerNationalityList";
import { getPlayerStats } from "@/components/admin/players/stats/playerStats.helpers";
import { supabase } from "@/lib/supabase";

export default async function AdminPlayersPage({ searchParams }) {
  const params = await searchParams;

  const { data: players } = await supabase
    .from("players")
    .select("*, teams(id, name_de, slug)")
    .order("sort_order", { ascending: true })
    .order("last_name", { ascending: true });

  const playerList = players || [];
  const stats = getPlayerStats(playerList);

  const initialFilters = {
    statusFilter: params?.status || "all",
    nationalityFilter: params?.nationality || "all",
  };

  const showNationalities = params?.view === "nationalities";

  return (
    <AdminLayout title="Spieler verwalten" subtitle="Adminbereich">
      <div className="mb-8 flex justify-end">
        <Link
          href="/admin/players/new"
          className="rounded-full bg-red-600 px-6 py-3 font-bold transition hover:bg-red-700"
        >
          Neuer Spieler
        </Link>
      </div>

      <PlayerStats
        total={stats.total}
        inactive={stats.inactive}
        nationalityCount={stats.nationalityCount}
        openContributions={stats.openContributions}
      />

      {showNationalities && (
        <PlayerNationalityList nationalities={stats.nationalities} />
      )}

      <AdminPlayersList players={playerList} initialFilters={initialFilters} />
    </AdminLayout>
  );
}
