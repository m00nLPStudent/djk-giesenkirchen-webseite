import AdminLayout from "@/components/admin/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import Can from "@/components/admin/auth/Can";
import { AdminEventsList } from "@/components/admin/events";
import { getAdminEvents } from "@/components/admin/events/services/events.service";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const { data: events } = await getAdminEvents();

  return (
    <AdminLayout
      title="Termine verwalten"
      subtitle="Adminbereich"
      showHeader={false}
    >
      <AdminPageHeader
        eyebrow="Termine"
        title="Termine verwalten"
        description="Öffentliche Veranstaltungen, Trainingseinträge und wiederkehrende Termine pflegen."
        actions={
          <Can permission="events.create" uiOnly>
            <Link
              href="/admin/events/new"
              className="rounded-full bg-red-600 px-6 py-3 font-bold transition hover:bg-red-700"
            >
              Neuer Termin
            </Link>
          </Can>
        }
      />

      <AdminEventsList events={events || []} />
    </AdminLayout>
  );
}
