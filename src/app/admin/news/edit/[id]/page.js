import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminNewsEditForm } from "@/components/admin/news";
import Can from "@/components/admin/auth/Can";
import DeleteNewsButton from "@/components/admin/ui/DeleteNewsButton";
import NewsDetailSummary from "@/components/admin/news/components/NewsDetailSummary";
import NewsStatusBadge from "@/components/admin/news/components/NewsStatusBadge";
import { AdminActionBar, AdminButton, AdminDangerZone, AdminDetailHeader, AdminDetailLayout } from "@/components/admin/design-system";
import { supabase } from "@/lib/supabase";
import { loadNewsCategories } from "@/components/admin/news/services/newsCategories.repository";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";

export default async function EditNewsPage({ params }) {
  const { id } = await params;
  const auth = await assertAdminActionPermission({ requiredPermission: "news.edit" });

  const { data: news } = await supabase
    .from("news")
    .select("*, news_documents(*)")
    .eq("id", id)
    .single();

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name_de, slug, is_active, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  const [{ data: categories }, { data: allCategories }] = auth.ok ? await Promise.all([loadNewsCategories(auth.supabaseServer), loadNewsCategories(auth.supabaseServer, { activeOnly: false })]) : [{ data: [] }, { data: [] }];

  return (
    <AdminLayout title="News bearbeiten" subtitle="News" showHeader={false}>
      <AdminDetailLayout header={<AdminDetailHeader backHref="/admin/news" backLabel="Zurück zu News" backVariant="pill" eyebrow="News" title={news.title_de} status={<NewsStatusBadge isPublished={news.is_published} publishedAt={news.published_at} />} meta={`${news.author || "Autor nicht hinterlegt"} · ${news.published_at ? new Date(news.published_at).toLocaleString("de-DE") : "Kein Veröffentlichungsdatum"}`} actions={<AdminActionBar><AdminButton href="#news-editor-form" variant="primary">Bearbeiten</AdminButton></AdminActionBar>} />} dangerZone={<Can permission="news.delete" uiOnly><AdminDangerZone title="News löschen" description="Die News und ihre unmittelbar zugehörigen Inhalte werden dauerhaft entfernt. Mannschaften, Spieler und Trainer bleiben erhalten."><DeleteNewsButton id={news.id} title={news.title_de} /></AdminDangerZone></Can>}>
        <NewsDetailSummary news={news} categories={allCategories || []} />
        <AdminNewsEditForm news={news} teams={teams || []} categories={categories || []} />
      </AdminDetailLayout>
    </AdminLayout>
  );
}
