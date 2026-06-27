import { supabase } from "@/lib/supabase";
import {
  TeamHero,
  TeamTrainingInfo,
  TeamContact,
  TeamCoachSection,
  TeamPlayerSection,
} from "@/components/website/team";

export default async function TeamPage({ params }) {
  const { slug } = await params;

  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("slug", slug)
    .single();

  const { data: coaches } = await supabase
    .from("coaches")
    .select("*")
    .eq("team_id", team?.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const { data: players } = await supabase
    .from("players")
    .select("*")
    .eq("team_id", team?.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("last_name", { ascending: true });

  return (
    <main className="min-h-screen bg-[#101014] text-white">
      <section className="px-6 pt-32 pb-20">
        <div className="mx-auto max-w-7xl">
          <TeamHero team={team} />

          <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
            Fußballabteilung
          </p>

          <h1 className="mt-6 text-6xl font-black">{team?.name_de}</h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/70">
            {team?.description_de || "Mannschaftsbeschreibung folgt."}
          </p>

          <TeamTrainingInfo team={team} />

          <TeamContact team={team} />

          <TeamCoachSection coaches={coaches || []} />

          <TeamPlayerSection players={players || []} teamSlug={slug} />
        </div>
      </section>
    </main>
  );
}
