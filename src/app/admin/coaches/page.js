import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminCoachesOverview } from "@/components/admin/coaches";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default async function AdminCoachesPage() {
  const { data: coaches } = await supabase
    .from("coaches")
    .select("*, teams(id, name_de, slug)")
    .order("sort_order", { ascending: true });

  const coachList = coaches || [];

  return (
    <AdminLayout title="Trainer verwalten" subtitle="Adminbereich">
      <div className="mb-8 flex justify-end">
        <Link
          href="/admin/coaches/new"
          className="rounded-full bg-red-600 px-6 py-3 font-bold transition hover:bg-red-700"
        >
          Neuer Trainer
        </Link>
      </div>

      <AdminCoachesOverview coaches={coachList} />
    </AdminLayout>
  );
}
