import AdminLayout from "@/components/admin/layout/AdminLayout";
import { ClubHistoryEditorForm } from "@/components/admin/club-history";
import ClubHistoryDetailOverview from "@/components/admin/club-history/components/ClubHistoryDetailOverview";
import ClubHistoryStatus from "@/components/admin/club-history/components/ClubHistoryStatus";
import { AdminActionBar, AdminButton, AdminDetailHeader, AdminDetailLayout, AdminModuleHeader, AdminModulePage } from "@/components/admin/design-system";
import { supabase } from "@/lib/supabase";

export default async function AdminClubHistoryPage() {
  const { data: page } = await supabase.from("club_history_pages").select("*").eq("page_key", "fussball-vereinsgeschichte").maybeSingle();
  const pageId = page?.id || null;
  const [imagesResult, milestonesResult] = await Promise.all([
    pageId ? supabase.from("club_history_images").select("*").eq("club_history_page_id", pageId).order("sort_order", { ascending: true }).order("created_at", { ascending: true }) : Promise.resolve({ data: [] }),
    pageId ? supabase.from("club_history_milestones").select("*").eq("club_history_page_id", pageId).order("milestone_year", { ascending: true }).order("sort_order", { ascending: true }).order("created_at", { ascending: true }) : Promise.resolve({ data: [] }),
  ]);
  const title = page?.title_de || "Vereinsgeschichte";

  return <AdminLayout title="Vereinsgeschichte" subtitle="Adminbereich" showHeader={false}><AdminModulePage><AdminModuleHeader eyebrow="Vereinsgeschichte" title="Vereinsgeschichte verwalten" description="Historische Inhalte, Meilensteine und Vereinsentwicklung verwalten." actions={!page ? <AdminButton href="#club-history-editor" variant="primary">+ Neuer Eintrag</AdminButton> : null} /><AdminDetailLayout header={<AdminDetailHeader backHref="/admin" backLabel="Zurück zum Dashboard" backVariant="pill" eyebrow="Vereinsgeschichte" title={title} status={<ClubHistoryStatus page={page} />} meta={page?.published_at ? `Veröffentlichung: ${new Date(page.published_at).toLocaleString("de-DE")}` : "Noch kein Veröffentlichungsdatum"} actions={<AdminActionBar><AdminButton href="#club-history-editor" variant="primary">Bearbeiten</AdminButton></AdminActionBar>} />}><ClubHistoryDetailOverview page={page} /><ClubHistoryEditorForm page={page || null} initialImages={imagesResult?.data || []} initialMilestones={milestonesResult?.data || []} /></AdminDetailLayout></AdminModulePage></AdminLayout>;
}
