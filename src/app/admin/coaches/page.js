import AdminLayout from "@/components/admin/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
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
    <AdminLayout
      title="Trainer verwalten"
      subtitle="Adminbereich"
      showHeader={false}
    >
      <AdminPageHeader
        eyebrow="Trainer"
        title="Trainer verwalten"
        description="Trainer- und Betreuerprofile pflegen und Zuordnungen zu Mannschaften prüfen."
        actions={
          <Link
            href="/admin/coaches/new"
            className="rounded-full bg-red-600 px-6 py-3 font-bold transition hover:bg-red-700"
          >
            Neuer Trainer
          </Link>
        }
      />

      <AdminCoachesOverview coaches={coachList} />
    </AdminLayout>
  );
}
