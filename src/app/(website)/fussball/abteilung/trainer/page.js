import {
  DepartmentPageLayout,
  DepartmentPersonCard,
  DepartmentPersonGrid,
  getCoachTeamName,
} from "@/components/website/department";
import { supabase } from "@/lib/supabase";

export default async function DepartmentCoachesPage() {
  const { data: coaches } = await supabase
    .from("coaches")
    .select("*, teams(name_de)")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <DepartmentPageLayout
      title="Trainer & Betreuer"
      description="Unser Trainer- und Betreuerteam mit Mannschaftszuordnung, Lizenz und Kontaktmöglichkeiten."
    >
      <DepartmentPersonGrid>
        {(coaches || []).map((coach) => (
          <DepartmentPersonCard
            key={coach.id}
            person={coach}
            imageBadge={getCoachTeamName(coach)}
            meta={coach.license}
          />
        ))}
      </DepartmentPersonGrid>
    </DepartmentPageLayout>
  );
}
