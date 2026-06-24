import BackButton from "@/components/BackButton";
import { supabase } from "@/lib/supabase";
import AdminTeamsForm from "@/components/AdminTeamsForm";

export default async function EditTeamPage({ params }) {
  const { id } = await params;

  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("id", id)
    .single();

  return (
    <main className="min-h-screen bg-[#101014] px-6 pt-32 pb-20 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
              Adminbereich
            </p>

            <h1 className="mt-4 text-5xl font-black">Neue Mannschaft</h1>
          </div>

          <BackButton />
        </div>
        <AdminTeamsForm team={team} />
      </div>
    </main>
  );
}
