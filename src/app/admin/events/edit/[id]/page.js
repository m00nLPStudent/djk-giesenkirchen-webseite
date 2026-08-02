import { notFound } from "next/navigation";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminEventsForm } from "@/components/admin/events";
import EventDetailSummary from "@/components/admin/events/components/EventDetailSummary";
import { createEventDto } from "@/components/admin/events/helpers/eventTypes.core";
import { loadEventTypes } from "@/components/admin/events/services/eventTypes.repository";
import { AdminActionBar, AdminButton, AdminDetailHeader, AdminDetailLayout, AdminStatusChip } from "@/components/admin/design-system";
import { formatEventDate, formatEventTime, getEventStatusKey } from "@/lib/events";
import { supabase } from "@/lib/supabase";

export default async function EditEventPage({ params }) {
  const { id } = await params;
  const [{ data: event }, { data: teams }, { data: eventTypes }] = await Promise.all([
    supabase.from("events").select("*, event_documents(*)").eq("id", id).single(),
    supabase.from("teams").select("id, name_de, is_active, sort_order").eq("is_active", true).order("sort_order", { ascending: true }),
    loadEventTypes(supabase, { activeOnly: false }),
  ]);
  if (!event) notFound();
  const eventDto = createEventDto(event, eventTypes || []);
  const status = getEventStatusKey(event);
  const statusLabel = status === "entwurf" ? "Entwurf" : status === "geplant" ? "Geplant" : "Veröffentlicht";
  const statusVariant = status === "entwurf" ? "default" : status === "geplant" ? "warning" : "success";
  const meta = `${formatEventDate(event.starts_at)} · ${formatEventTime(event.starts_at, { isAllDay: event.is_all_day })}`;

  return <AdminLayout title="Termin bearbeiten" subtitle="Termine" showHeader={false}><AdminDetailLayout header={<AdminDetailHeader backHref="/admin/events" backLabel="Zurück zu Termine" backVariant="pill" eyebrow={eventDto.eventTypeLabel} title={event.title_de} status={<AdminStatusChip compact variant={statusVariant}>{statusLabel}</AdminStatusChip>} meta={meta} actions={<AdminActionBar><AdminButton href="#event-editor-form" variant="primary">Bearbeiten</AdminButton></AdminActionBar>} />}><EventDetailSummary event={eventDto} /><AdminEventsForm event={event} teams={teams || []} eventTypes={(eventTypes || []).filter((item) => item.is_active)} /></AdminDetailLayout></AdminLayout>;
}
