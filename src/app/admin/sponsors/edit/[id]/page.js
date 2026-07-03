import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminSponsorForm } from "@/components/admin/sponsors";
import { supabase } from "@/lib/supabase";

export default async function EditSponsorPage({ params }) {
  const { id } = await params;

  const { data: sponsor } = await supabase
    .from("sponsors")
    .select("*")
    .eq("id", id)
    .single();

  const { data: categories } = await supabase
    .from("sponsor_categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <AdminLayout title="Sponsor bearbeiten" subtitle="Sponsoren">
      <AdminSponsorForm sponsor={sponsor} categories={categories || []} />
    </AdminLayout>
  );
}
