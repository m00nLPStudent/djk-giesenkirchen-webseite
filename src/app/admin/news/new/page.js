import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminNewsForm } from "@/components/admin/news";
import { AdminDetailHeader, AdminDetailLayout } from "@/components/admin/design-system";
import { supabase } from "@/lib/supabase";
import { loadNewsCategories } from "@/components/admin/news/services/newsCategories.repository";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";

export default async function NewNewsPage() {
  const auth = await assertAdminActionPermission({ requiredPermission: "news.create" });
  const { data: categories } = auth.ok ? await loadNewsCategories(auth.supabaseServer) : { data: [] };
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name_de, slug, is_active, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <AdminLayout title="Neue News" subtitle="News" showHeader={false}>
      <AdminDetailLayout header={<AdminDetailHeader backHref="/admin/news" backLabel="Zurück zu News" backVariant="pill" eyebrow="News" title="Neue News" meta="News erstellen und zur Veröffentlichung vorbereiten." />}>
        <AdminNewsForm teams={teams || []} categories={categories || []} />
      </AdminDetailLayout>
    </AdminLayout>
  );
}
