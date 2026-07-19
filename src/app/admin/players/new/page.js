import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminPlayersForm } from "@/components/admin/players";
import BackButton from "@/components/admin/ui/BackButton";
import { supabase } from "@/lib/supabase";

export default async function NewPlayerPage() {
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name_de")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <AdminLayout title="Neuer Spieler" subtitle="Spieler">
      <BackButton />
      <AdminPlayersForm teams={teams || []} />
    </AdminLayout>
  );
}
