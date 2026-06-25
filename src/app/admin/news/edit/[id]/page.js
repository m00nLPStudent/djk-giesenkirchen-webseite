import AdminLayout from "@/components/admin/layout/AdminLayout";
import AdminNewsEditForm from "@/components/admin/news/AdminNewsEditForm";
import BackButton from "@/components/admin/ui/BackButton";
import { supabase } from "@/lib/supabase";

export default async function EditNewsPage({ params }) {
  const { id } = await params;

  const { data: news } = await supabase
    .from("news")
    .select("*")
    .eq("id", id)
    .single();

  return (
    <AdminLayout title="News bearbeiten" subtitle="News">
      <BackButton />
      <AdminNewsEditForm news={news} />
    </AdminLayout>
  );
}
