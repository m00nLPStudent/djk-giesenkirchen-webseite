import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminCoachesList, CoachStats } from "@/components/admin/coaches";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default async function AdminCoachesPage() {
  const { data: coaches } = await supabase
    .from("coaches")
    .select("*, teams(id, name_de, slug)")
    .order("sort_order", { ascending: true });

  const coachList = coaches || [];

  const active = coachList.filter((coach) => coach.is_active).length;
  const inactive = coachList.filter((coach) => !coach.is_active).length;
  const assignedTeams = coachList.filter((coach) => coach.team_id).length;

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

      <CoachStats
        total={coachList.length}
        active={active}
        inactive={inactive}
        assignedTeams={assignedTeams}
      />

      <AdminCoachesList coaches={coachList} />
    </AdminLayout>
  );
}
