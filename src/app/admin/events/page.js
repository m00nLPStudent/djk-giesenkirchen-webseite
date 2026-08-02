import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminEventsList } from "@/components/admin/events";
import { getNextCalendarDayWindow, prepareAdminEventList } from "@/components/admin/events/eventList.helpers";
import { getAdminEvents } from "@/components/admin/events/services/events.service";
import { loadEventTypes } from "@/components/admin/events/services/eventTypes.repository";
import { createEventDtos } from "@/components/admin/events/helpers/eventTypes.core";
import { canAccessTeamOnServer, loadServerTeamScopeContext } from "@/components/admin/teams/serverTeamScope";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { getVirtualTrainingEvents } from "@/lib/events";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const permissionResult = await assertAdminActionPermission({ requiredPermission: "events.view" });
  if (!permissionResult.ok) redirect("/admin/unauthorized?reason=missing-events-permission");

  const now = new Date();
  const tomorrow = getNextCalendarDayWindow(now);
  const [{ data: events }, virtualTrainings, scopeContext, { data: eventTypes }] = await Promise.all([
    getAdminEvents(),
    getVirtualTrainingEvents({ ...tomorrow, maxOccurrencesPerTraining: 1, supabaseClient: permissionResult.supabaseServer }),
    loadServerTeamScopeContext(permissionResult),
    loadEventTypes(permissionResult.supabaseServer, { activeOnly: false }),
  ]);
  const scopedTrainings = virtualTrainings.filter((event) => canAccessTeamOnServer(scopeContext, event));
  const eventList = createEventDtos(prepareAdminEventList(events || [], scopedTrainings, now), eventTypes || []);

  return <AdminLayout title="Termine verwalten" subtitle="Adminbereich" showHeader={false}><AdminEventsList events={eventList} /></AdminLayout>;
}
