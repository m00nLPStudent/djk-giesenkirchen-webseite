import DepartmentPersonCard from "@/components/website/department/DepartmentPersonCard";
import { supabase } from "@/lib/supabase";

function getCoachTeam(coach = {}) {
  if (coach.teams?.name_de) return coach.teams.name_de;
  if (coach.team_name) return coach.team_name;
  return "Keine Mannschaft zugeordnet";
}

export default async function DepartmentCoachesPage() {
  const { data: coaches } = await supabase
    .from("coaches")
    .select("*, teams(name_de)")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <main className="min-h-screen bg-[#101014] px-6 pt-48 pb-24 text-white md:pt-56">
      <section className="mx-auto max-w-7xl">
        <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">Fußballabteilung</p>
        <h1 className="mt-5 max-w-4xl text-5xl font-black leading-tight md:text-7xl">Trainer & Betreuer</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-white/60">
          Unser Trainer- und Betreuerteam mit Mannschaftszuordnung, Lizenz und Kontaktmöglichkeiten.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
    </main>
  );
}
