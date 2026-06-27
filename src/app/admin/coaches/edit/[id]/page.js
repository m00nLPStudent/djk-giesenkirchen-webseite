import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminCoachesForm } from "@/components/admin/coaches";
import BackButton from "@/components/admin/ui/BackButton";
import { supabase } from "@/lib/supabase";

export default async function EditCoachPage({ params }) {
  const { id } = await params;

  const { data: coach } = await supabase
    .from("coaches")
    .select("*")
    .eq("id", id)
    .single();

  return (
    <AdminLayout title="Trainer bearbeiten" subtitle="Trainer">
      <BackButton />
      <AdminCoachesForm coach={coach} />
    </AdminLayout>
  );
}
