import {
  DepartmentPageLayout,
  DepartmentPersonCard,
  DepartmentPersonGrid,
  getCoachTeamName,
} from "@/components/website/department";
import { loadActivePublicCoachDtos } from "@/components/website/coach/coachPublic.repository";
import { supabase } from "@/lib/supabase";

export default async function DepartmentCoachesPage() {
  const coaches = await loadActivePublicCoachDtos(supabase);

  return (
    <DepartmentPageLayout
      title="Trainer & Betreuer"
      description="Unser Trainer- und Betreuerteam mit Mannschaftszuordnung, Lizenz und Kontaktmöglichkeiten."
    >
      <DepartmentPersonGrid>
        {coaches.map((coach) => (
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
