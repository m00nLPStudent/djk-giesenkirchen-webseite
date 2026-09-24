import {
  DepartmentPageLayout,
  DepartmentPersonCard,
  DepartmentPersonGrid,
  getCoachTeamName,
} from "@/components/website/department";
import { loadActivePublicCoachDtos } from "@/components/website/coach/coachPublic.repository";
import { supabase } from "@/lib/supabase";
import { getPublicCoachLicense } from "@/components/website/coach/coachPublic.core.mjs";

export const dynamic = "force-dynamic";

export default async function DepartmentCoachesPage() {
  const { data: footballDepartment, error: departmentError } = await supabase.from("departments").select("id").eq("slug", "fussball").eq("is_active", true).maybeSingle();
  if (departmentError) throw new Error(`Football department query failed: ${departmentError.message}`);
  const coaches = footballDepartment?.id ? await loadActivePublicCoachDtos(supabase, { departmentId: footballDepartment.id }) : [];

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
            meta={getPublicCoachLicense(coach.license)}
          />
        ))}
      </DepartmentPersonGrid>
    </DepartmentPageLayout>
  );
}
