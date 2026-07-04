import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminEventsForm } from "@/components/admin/events";
import BackButton from "@/components/admin/ui/BackButton";
import { supabase } from "@/lib/supabase";

export default async function EditEventPage({ params }) {
  const { id } = await params;

  const { data: event } = await supabase
    .from("events")
    .select("*, event_documents(*)")
    .eq("id", id)
    .single();

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name_de, is_active, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <AdminLayout title="Termin bearbeiten" subtitle="Termine">
      <BackButton />
      <AdminEventsForm event={event} teams={teams || []} />
    </AdminLayout>
  );
}
