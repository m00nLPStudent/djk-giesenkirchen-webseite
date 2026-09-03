import {
  DepartmentPageLayout,
  DepartmentPersonCard,
  DepartmentPersonGrid,
  mapBoardMemberForDisplay,
} from "@/components/website/department";
import { supabase } from "@/lib/supabase";
import { loadPublicMediaUrlMap } from "@/components/admin/media-library/media.service";
import { resolveLoadedPublicMediaImage } from "@/lib/people/publicMediaImage.mjs";
import { COACH_PLACEHOLDER_IMAGE as BOARD_PLACEHOLDER_IMAGE } from "@/constants/images";

export default async function DepartmentBoardPage() {
  const { data: footballDepartment } = await supabase
    .from("departments")
    .select("id")
    .eq("slug", "fussball")
    .eq("is_active", true)
    .maybeSingle();

  let boardMembers = [];
  if (footballDepartment?.id) {
    const result = await supabase
      .from("board_members")
      .select("*, board_roles(name_de, name_en)")
      .eq("organization_scope", "department")
      .eq("department_id", footballDepartment.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    boardMembers = result.data || [];
  }

  const mediaResult = await loadPublicMediaUrlMap((boardMembers || []).map((member) => member.image_media_asset_id));
  return (
    <DepartmentPageLayout
      title="Vorstand"
      description="Ansprechpartner des Vorstands der Fußballabteilung."
    >
      <DepartmentPersonGrid emptyText="Noch keine Vorstandsmitglieder angelegt.">
        {(boardMembers || []).map((member) => (
          <DepartmentPersonCard
            key={member.id}
            person={mapBoardMemberForDisplay({ ...member, image_url: resolveLoadedPublicMediaImage(member, mediaResult.data, BOARD_PLACEHOLDER_IMAGE) })}
          />
        ))}
      </DepartmentPersonGrid>
    </DepartmentPageLayout>
  );
}
