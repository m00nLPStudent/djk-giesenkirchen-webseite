import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminNewsForm } from "@/components/admin/news";
import { AdminDetailHeader, AdminDetailLayout } from "@/components/admin/design-system";
import { loadNewsCategories } from "@/components/admin/news/services/newsCategories.repository";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { loadEditorialDepartmentScope } from "@/lib/admin-auth/scopes/editorialDepartmentScope.server";
import { redirect } from "next/navigation";

export default async function NewNewsPage() {
  const auth = await assertAdminActionPermission({ requiredPermission: "news.create" });
  if (!auth.ok) redirect(`/admin/unauthorized?reason=${auth.reason}`);
  const { scope } = await loadEditorialDepartmentScope(auth);
  if (!scope.valid) redirect("/admin/unauthorized?reason=invalid-department-scope");
  const { data: loadedCategories } = await loadNewsCategories(auth.supabaseServer);
  let teamsQuery = auth.supabaseServer
    .from("teams")
    .select("id, name_de, slug, is_active, sort_order, department_id")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (scope.mode === "department") teamsQuery = teamsQuery.eq("department_id", scope.departmentId);
  const { data: teams } = await teamsQuery;
  const categories = scope.mode === "department" ? (loadedCategories || []).filter((item) => item.slug === scope.departmentSlug) : loadedCategories;

  return (
    <AdminLayout title="Neue News" subtitle="News" showHeader={false}>
      <AdminDetailLayout header={<AdminDetailHeader backHref="/admin/news" backLabel="Zurück zu News" backVariant="pill" eyebrow="News" title="Neue News" meta="News erstellen und zur Veröffentlichung vorbereiten." />}>
        <AdminNewsForm teams={teams || []} categories={categories || []} />
      </AdminDetailLayout>
    </AdminLayout>
  );
}
