import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminTeamsForm } from "@/components/admin/teams";
import BackButton from "@/components/admin/ui/BackButton";
import { supabase } from "@/lib/supabase";

export default async function NewTeamPage() {
  const { data: seasons } = await supabase
    .from("seasons")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const { data: players } = await supabase
    .from("players")
    .select("*")
    .eq("is_active", true)
    .order("last_name", { ascending: true });

  const { data: coaches } = await supabase
    .from("coaches")
    .select("*")
    .eq("is_active", true)
    .order("last_name", { ascending: true });

  return (
    <AdminLayout title="Neue Mannschaft" subtitle="Mannschaften">
      <BackButton />
      <AdminTeamsForm seasons={seasons || []} players={players || []} coaches={coaches || []} />
    </AdminLayout>
  );
}
