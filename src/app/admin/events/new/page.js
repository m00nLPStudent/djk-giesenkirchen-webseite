import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminEventsForm } from "@/components/admin/events";
import { loadEventTypes } from "@/components/admin/events/services/eventTypes.repository";
import { AdminDetailHeader, AdminDetailLayout, AdminStatusChip } from "@/components/admin/design-system";
import { supabase } from "@/lib/supabase";

export default async function NewEventPage() {
  const [{ data: teams }, { data: eventTypes }] = await Promise.all([
    supabase.from("teams").select("id, name_de, is_active, sort_order").eq("is_active", true).order("sort_order", { ascending: true }),
    loadEventTypes(supabase),
  ]);

  return <AdminLayout title="Neuer Termin" subtitle="Termine" showHeader={false}><AdminDetailLayout header={<AdminDetailHeader backHref="/admin/events" backLabel="Zurück zu Termine" backVariant="pill" eyebrow="Termin" title="Neuer Termin" status={<AdminStatusChip compact>Entwurf</AdminStatusChip>} meta="Termin anlegen und über die vorhandene Veröffentlichungslogik freigeben." />}><AdminEventsForm teams={teams || []} eventTypes={eventTypes || []} /></AdminDetailLayout></AdminLayout>;
}
