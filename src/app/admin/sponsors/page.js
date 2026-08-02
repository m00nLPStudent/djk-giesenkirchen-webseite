import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminSponsorList } from "@/components/admin/sponsors";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AdminSponsorsPage() {
  const { data: sponsors } = await supabase.from("sponsors").select("*, sponsor_categories(name_de)").order("sort_order", { ascending: true });
  return <AdminLayout title="Sponsoren" subtitle="Adminbereich" showHeader={false}><AdminSponsorList sponsors={sponsors || []} /></AdminLayout>;
}
