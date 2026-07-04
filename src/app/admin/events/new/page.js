import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminEventsForm } from "@/components/admin/events";
import BackButton from "@/components/admin/ui/BackButton";
import { supabase } from "@/lib/supabase";

export default async function NewEventPage() {
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name_de, is_active, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <AdminLayout title="Neuer Termin" subtitle="Termine">
      <BackButton />
      <AdminEventsForm teams={teams || []} />
    </AdminLayout>
  );
}
