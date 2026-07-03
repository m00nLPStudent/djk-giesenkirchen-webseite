import Link from "next/link";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminSponsorList } from "@/components/admin/sponsors";
import { supabase } from "@/lib/supabase";

export default async function AdminSponsorsPage() {
  const { data: sponsors } = await supabase
    .from("sponsors")
    .select("*, sponsor_categories(name_de)")
    .order("sort_order", { ascending: true });

  return (
    <AdminLayout title="Sponsoren" subtitle="Adminbereich">
      <div className="mb-8 flex justify-end">
        <Link href="/admin/sponsors/new" className="rounded-full bg-red-600 px-6 py-3 font-bold transition hover:bg-red-700">
          Neuer Sponsor
        </Link>
      </div>
      <AdminSponsorList sponsors={sponsors || []} />
    </AdminLayout>
  );
}
