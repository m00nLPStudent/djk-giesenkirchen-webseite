import Link from "next/link";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminPlayersList, PlayerStats } from "@/components/admin/players";
import { supabase } from "@/lib/supabase";

export default async function AdminPlayersPage() {
  const { data: players } = await supabase
    .from("players")
    .select("*")
    .order("sort_order", { ascending: true });

  const playerList = players || [];
  const active = playerList.filter((item) => item.is_active).length;
  const inactive = playerList.length - active;

  return (
    <AdminLayout title="Spieler verwalten" subtitle="Adminbereich">
      <div className="mb-8 flex justify-end">
        <Link href="/admin/players/new" className="rounded-full bg-red-600 px-6 py-3 font-bold transition hover:bg-red-700">
          Neuer Spieler
        </Link>
      </div>

      <PlayerStats total={playerList.length} active={active} inactive={inactive} goalkeepers={0} />
      <AdminPlayersList players={playerList} />
    </AdminLayout>
  );
}
