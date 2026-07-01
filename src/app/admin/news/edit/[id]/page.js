import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminNewsEditForm } from "@/components/admin/news";
import BackButton from "@/components/admin/ui/BackButton";
import { supabase } from "@/lib/supabase";

export default async function EditNewsPage({ params }) {
  const { id } = await params;

  const { data: news } = await supabase
    .from("news")
    .select("*")
    .eq("id", id)
    .single();

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name_de, slug, is_active, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <AdminLayout title="News bearbeiten" subtitle="News">
      <BackButton />
      <AdminNewsEditForm news={news} teams={teams || []} />
    </AdminLayout>
  );
}
