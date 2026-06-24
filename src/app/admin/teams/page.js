import AdminTeamsList from "@/components/AdminTeamsList";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default async function AdminTeamsPage() {
  const { data: teams } = await supabase
    .from("teams")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <main className="min-h-screen bg-[#101014] px-6 pt-32 pb-20 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
              Adminbereich
            </p>

            <h1 className="mt-4 text-5xl font-black">Mannschaften verwalten</h1>
          </div>

          <Link
            href="/admin/teams/new"
            className="rounded-full bg-red-600 px-6 py-3 font-bold transition hover:bg-red-700"
          >
            Neue Mannschaft
          </Link>
        </div>

        <AdminTeamsList teams={teams || []} />
      </div>
    </main>
  );
}
