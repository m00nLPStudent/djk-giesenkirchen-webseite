import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminTeamsForm } from "@/components/admin/teams";
import BackButton from "@/components/admin/ui/BackButton";
import { supabase } from "@/lib/supabase";

export default async function EditTeamPage({ params }) {
  const { id } = await params;

  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("id", id)
    .single();

  const { data: seasons } = await supabase
    .from("seasons")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const { data: teamSeasons } = await supabase
    .from("team_seasons")
    .select("*")
    .eq("team_id", id);

  return (
    <AdminLayout title="Mannschaft bearbeiten" subtitle="Mannschaften">
      <BackButton />
      <AdminTeamsForm team={team} seasons={seasons || []} teamSeasons={teamSeasons || []} />
    </AdminLayout>
  );
}
