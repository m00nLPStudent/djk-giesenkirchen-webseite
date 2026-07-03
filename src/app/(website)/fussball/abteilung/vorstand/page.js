import {
  DepartmentPageLayout,
  DepartmentPersonCard,
  DepartmentPersonGrid,
  mapBoardMemberForDisplay,
} from "@/components/website/department";
import { supabase } from "@/lib/supabase";

export default async function DepartmentBoardPage() {
  const { data: boardMembers } = await supabase
    .from("board_members")
    .select("*, board_roles(name_de, name_en)")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <DepartmentPageLayout
      title="Vorstand"
      description="Ansprechpartner des Vorstands der Fußballabteilung."
    >
      <DepartmentPersonGrid emptyText="Noch keine Vorstandsmitglieder angelegt.">
        {(boardMembers || []).map((member) => (
          <DepartmentPersonCard
            key={member.id}
            person={mapBoardMemberForDisplay(member)}
          />
        ))}
      </DepartmentPersonGrid>
    </DepartmentPageLayout>
  );
}
