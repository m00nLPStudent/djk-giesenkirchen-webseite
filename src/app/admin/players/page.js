import Link from "next/link";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminPlayersList, PlayerStats } from "@/components/admin/players";
import { supabase } from "@/lib/supabase";

export default async function AdminPlayersPage() {
  const { data: players } = await supabase
    .from("players")
    .select("*, teams(id, name_de, slug)")
    .order("sort_order", { ascending: true })
    .order("last_name", { ascending: true });

  const playerList = players || [];

  const active = playerList.filter((player) => player.is_active).length;
  const inactive = playerList.length - active;
  const goalkeepers = playerList.filter((player) =>
    (player.position_de || "").toLowerCase().includes("tor"),
  ).length;

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
        total={playerList.length}
        active={active}
        inactive={inactive}
        goalkeepers={goalkeepers}
      />

      <AdminPlayersList players={playerList} />
    </AdminLayout>
  );
}
