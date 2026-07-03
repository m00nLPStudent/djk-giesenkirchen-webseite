import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminSponsorForm } from "@/components/admin/sponsors";
import { supabase } from "@/lib/supabase";

export default async function NewSponsorPage() {
  const { data: categories } = await supabase
    .from("sponsor_categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <AdminLayout title="Neuer Sponsor" subtitle="Sponsoren">
      <AdminSponsorForm categories={categories || []} />
    </AdminLayout>
  );
}
