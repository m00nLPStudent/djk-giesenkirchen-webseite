import { supabase } from "@/lib/supabase";
import {
  TeamHero,
  TeamIntroCard,
  TeamInfoGrid,
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
      <section className="px-6 pt-32 pb-24">
        <div className="mx-auto max-w-7xl space-y-8">
          <TeamHero team={team} />
          <TeamIntroCard team={team} />
          <TeamInfoGrid team={team} />
          <TeamCoachSection coaches={coaches || []} />
          <TeamPlayerSection players={players || []} teamSlug={slug} />
        </div>
      </section>
    </main>
  );
}
