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

  return (
    <AdminLayout title="Mannschaft bearbeiten" subtitle="Mannschaften">
      <BackButton />
      <AdminTeamsForm team={team} />
    </AdminLayout>
  );
}
