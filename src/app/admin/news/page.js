import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminNewsList } from "@/components/admin/news";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function getNewsStatus(item) {
  const now = new Date();

  if (!item.is_published) {
    return "entwurf";
  }

  if (item.published_at && new Date(item.published_at) > now) {
    return "geplant";
  }

  return "veroeffentlicht";
}

export default async function AdminNewsPage() {
  const { data: news } = await supabase
    .from("news")
    .select("*, football_team:football_team_id(name_de)")
    .order("created_at", { ascending: false });

  const newsList = news || [];

  const published = newsList.filter(
    (item) => getNewsStatus(item) === "veroeffentlicht",
  ).length;

  const planned = newsList.filter(
    (item) => getNewsStatus(item) === "geplant",
  ).length;

  const drafts = newsList.filter(
    (item) => getNewsStatus(item) === "entwurf",
  ).length;

  return (
    <AdminLayout title="News verwalten" subtitle="Adminbereich" showHeader={false}>
      <AdminNewsList news={newsList} total={newsList.length} published={published} planned={planned} drafts={drafts} />
    </AdminLayout>
  );
}
