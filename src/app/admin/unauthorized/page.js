import Link from "next/link";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import AdminPanel from "@/components/admin/common/AdminPanel";

export default function AdminUnauthorizedPage() {
  return (
    <AdminLayout
      title="Kein Zugriff"
      subtitle="Adminbereich"
      showHeader={false}
    >
      <AdminPanel className="p-7 md:p-8">
        <p className="text-[0.7rem] font-black uppercase tracking-[0.3em] text-red-300">
          Unauthorized
        </p>
        <h2 className="mt-2 text-2xl font-black text-white">Kein Zugriff</h2>
        <p className="mt-3 text-sm text-white/60">
          Fuer diesen Bereich fehlen Berechtigungen. Kehre zur Uebersicht
          zurueck.
        </p>
        <Link
          href="/admin"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-black text-white transition hover:bg-red-700"
        >
          Zurueck zum Dashboard
        </Link>
      </AdminPanel>
    </AdminLayout>
  );
}
