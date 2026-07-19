import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminPlayersForm } from "@/components/admin/players";
import BackButton from "@/components/admin/ui/BackButton";
import { supabase } from "@/lib/supabase";

export default async function EditPlayerPage({ params }) {
  const { id } = await params;
  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .single();
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name_de")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <AdminLayout title="Spieler bearbeiten" subtitle="Spieler">
      <BackButton />
      <AdminPlayersForm player={player} teams={teams || []} />
    </AdminLayout>
  );
}
