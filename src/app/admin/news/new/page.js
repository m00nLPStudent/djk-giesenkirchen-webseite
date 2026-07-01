import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminNewsForm } from "@/components/admin/news";
import BackButton from "@/components/admin/ui/BackButton";
import { supabase } from "@/lib/supabase";

export default async function NewNewsPage() {
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name_de, slug, is_active, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <AdminLayout title="Neue News" subtitle="News">
      <BackButton />
      <AdminNewsForm teams={teams || []} />
    </AdminLayout>
  );
}
