import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminSponsorForm } from "@/components/admin/sponsors";
import { AdminDetailHeader, AdminDetailLayout, AdminStatusChip } from "@/components/admin/design-system";
import { supabase } from "@/lib/supabase";

export default async function NewSponsorPage() {
  const { data: categories } = await supabase.from("sponsor_categories").select("*").eq("is_active", true).order("sort_order", { ascending: true });
  return <AdminLayout title="Neuer Sponsor" subtitle="Sponsoren" showHeader={false}><AdminDetailLayout header={<AdminDetailHeader backHref="/admin/sponsors" backLabel="Zurück zu Sponsoren" backVariant="pill" eyebrow="Sponsor" title="Neuer Sponsor" status={<AdminStatusChip compact>Entwurf</AdminStatusChip>} meta="Sponsor, Logo, Verlinkungen und Sichtbarkeit anlegen." />}><AdminSponsorForm categories={categories || []} /></AdminDetailLayout></AdminLayout>;
}
