import AdminLayout from "@/components/admin/layout/AdminLayout";
import AdminTeamsList from "@/components/admin/teams/AdminTeamsList";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default async function AdminTeamsPage() {
  const { data: teams } = await supabase
    .from("teams")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <AdminLayout title="Mannschaften verwalten" subtitle="Adminbereich">
      <div className="mb-8 flex justify-end">
        <Link
          href="/admin/teams/new"
          className="rounded-full bg-red-600 px-6 py-3 font-bold transition hover:bg-red-700"
        >
          Neue Mannschaft
        </Link>
      </div>

      <AdminTeamsList teams={teams || []} />
    </AdminLayout>
  );
}
