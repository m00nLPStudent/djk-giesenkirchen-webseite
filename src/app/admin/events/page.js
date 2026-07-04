import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminEventsList } from "@/components/admin/events";
import { getAdminEvents } from "@/components/admin/events/services/events.service";
import Link from "next/link";

export default async function AdminEventsPage() {
  const { data: events } = await getAdminEvents();

  return (
    <AdminLayout title="Termine verwalten" subtitle="Adminbereich">
      <div className="mb-8 flex justify-end">
        <Link
          href="/admin/events/new"
          className="rounded-full bg-red-600 px-6 py-3 font-bold transition hover:bg-red-700"
        >
          Neuer Termin
        </Link>
      </div>

      <AdminEventsList events={events || []} />
    </AdminLayout>
  );
}
