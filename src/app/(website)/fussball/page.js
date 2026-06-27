import { supabase } from "@/lib/supabase";
import { FootballHero, FootballSection } from "@/components/website/football";

export default async function FootballPage() {
  const { data: teams } = await supabase
    .from("teams")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const junioren =
    teams?.filter((team) =>
      (team.age_group || "").toLowerCase().includes("jugend"),
    ) || [];

  const damen =
    teams?.filter((team) => team.name_de?.toLowerCase().includes("damen")) ||
    [];

  const senioren =
    teams?.filter((team) => {
      const age = (team.age_group || "").toLowerCase();
      const name = (team.name_de || "").toLowerCase();

      return age.includes("senior") && !name.includes("damen");
    }) || [];

  return (
    <main className="min-h-screen bg-[#101014] pt-32 pb-24 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <FootballHero />

        <FootballSection id="junioren" title="Junioren" teams={junioren} />

        <FootballSection id="senioren" title="Senioren" teams={senioren} />

        <FootballSection id="damen" title="Damen" teams={damen} />
      </div>
    </main>
  );
}
