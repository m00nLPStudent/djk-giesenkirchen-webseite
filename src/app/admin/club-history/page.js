import AdminLayout from "@/components/admin/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import { ClubHistoryEditorForm } from "@/components/admin/club-history";
import { supabase } from "@/lib/supabase";

export default async function AdminClubHistoryPage() {
  const { data: page } = await supabase
    .from("club_history_pages")
    .select("*")
    .eq("page_key", "fussball-vereinsgeschichte")
    .maybeSingle();

  const pageId = page?.id || null;

  const [imagesResult, milestonesResult] = await Promise.all([
    pageId
      ? supabase
          .from("club_history_images")
          .select("*")
          .eq("club_history_page_id", pageId)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] }),
    pageId
      ? supabase
          .from("club_history_milestones")
          .select("*")
          .eq("club_history_page_id", pageId)
          .order("milestone_year", { ascending: true })
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <AdminLayout
      title="Vereinsgeschichte"
      subtitle="Adminbereich"
      showHeader={false}
    >
      <AdminPageHeader
        eyebrow="Vereinsgeschichte"
        title="Vereinsgeschichte"
        description="Chronik, Bilder und Meilensteine für die öffentliche Abteilungsseite pflegen."
      />

      <ClubHistoryEditorForm
        page={page || null}
        initialImages={imagesResult?.data || []}
        initialMilestones={milestonesResult?.data || []}
      />
    </AdminLayout>
  );
}
