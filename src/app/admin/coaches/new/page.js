import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminCoachesForm } from "@/components/admin/coaches";
import BackButton from "@/components/admin/ui/BackButton";
import { supabase } from "@/lib/supabase";

export default async function NewCoachPage() {
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name_de")
    .order("sort_order", { ascending: true });

  return (
    <AdminLayout title="Neuer Trainer" subtitle="Trainer">
      <BackButton />
      <AdminCoachesForm teams={teams || []} />
    </AdminLayout>
  );
}
