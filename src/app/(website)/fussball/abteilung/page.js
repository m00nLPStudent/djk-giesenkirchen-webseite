import { supabase } from "@/lib/supabase";
import DepartmentPersonCard from "@/components/website/department/DepartmentPersonCard";

function getCoachTeam(coach = {}) {
  if (coach.teams?.name_de) return coach.teams.name_de;
  if (coach.team_name) return coach.team_name;
  return "Keine Mannschaft zugeordnet";
}

export default async function FootballDepartmentPage() {
  const { data: boardMembers } = await supabase
    .from("board_members")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const { data: coaches } = await supabase
    .from("coaches")
    .select("*, teams(name_de)")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <main className="min-h-screen bg-[#101014] px-6 pt-48 pb-24 text-white md:pt-56">
      <section className="mx-auto max-w-7xl">
        <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">Fußballabteilung</p>
        <h1 className="mt-5 max-w-4xl text-5xl font-black leading-tight md:text-7xl">Abteilung & Ansprechpartner</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-white/60">
          Hier findest du die Ansprechpartner der Fußballabteilung sowie unser Trainer- und Betreuerteam.
        </p>

        <section id="vorstand" className="mt-16 scroll-mt-40">
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">Vorstand</p>
          <h2 className="mt-3 text-4xl font-black">Vorstand der Fußballabteilung</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {(boardMembers || []).map((member) => (
              <DepartmentPersonCard key={member.id} person={member} />
            ))}
          </div>
        </section>

        <section id="trainer" className="mt-20 scroll-mt-40">
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">Trainer</p>
          <h2 className="mt-3 text-4xl font-black">Trainer & Betreuer</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {(coaches || []).map((coach) => (
              <DepartmentPersonCard
                key={coach.id}
                person={coach}
                imageBadge={getCoachTeam(coach)}
                meta={coach.license}
              />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
