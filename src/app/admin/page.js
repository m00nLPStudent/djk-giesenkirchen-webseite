import AdminLayout from "@/components/admin/layout/AdminLayout";
import Link from "next/link";

export default function AdminPage() {
  return (
    <AdminLayout title="Dashboard" subtitle="Adminbereich">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/news"
          className="rounded-3xl border border-white/10 bg-white/5 p-8 hover:bg-white/10"
        >
          <h2 className="text-2xl font-black">News verwalten</h2>
          <p className="mt-4 text-white/60">
            Beiträge erstellen, bearbeiten und veröffentlichen.
          </p>
        </Link>

        <Link
          href="/admin/teams"
          className="rounded-3xl border border-white/10 bg-white/5 p-8 hover:bg-white/10"
        >
          <h2 className="text-2xl font-black">Mannschaften</h2>
          <p className="mt-4 text-white/60">
            Mannschaften, Bilder und Trainingszeiten pflegen.
          </p>
        </Link>

        <Link
          href="/admin/players"
          className="rounded-3xl border border-white/10 bg-white/5 p-8 hover:bg-white/10"
        >
          <h2 className="text-2xl font-black">Spieler & Trainer</h2>
          <p className="mt-4 text-white/60">
            Kader, Rückennummern, Positionen und Bilder verwalten.
          </p>
        </Link>
      </div>
    </AdminLayout>
  );
}
