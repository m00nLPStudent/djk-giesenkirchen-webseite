import Link from "next/link";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import { AdminSponsorList } from "@/components/admin/sponsors";
import { supabase } from "@/lib/supabase";

export default async function AdminSponsorsPage() {
  const { data: sponsors } = await supabase
    .from("sponsors")
    .select("*, sponsor_categories(name_de)")
    .order("sort_order", { ascending: true });

  return (
    <AdminLayout title="Sponsoren" subtitle="Adminbereich" showHeader={false}>
      <AdminPageHeader
        eyebrow="Sponsoren"
        title="Sponsoren"
        description="Sponsoren, Kategorien und Zuordnungen für die öffentliche Darstellung verwalten."
        actions={
          <Link
            href="/admin/sponsors/new"
            className="rounded-full bg-red-600 px-6 py-3 font-bold transition hover:bg-red-700"
          >
            Neuer Sponsor
          </Link>
        }
      />
      <AdminSponsorList sponsors={sponsors || []} />
    </AdminLayout>
  );
}
