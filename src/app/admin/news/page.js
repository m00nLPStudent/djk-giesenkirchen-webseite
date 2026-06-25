import AdminLayout from "@/components/admin/layout/AdminLayout";
import AdminNewsList from "@/components/admin/news/AdminNewsList";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default async function AdminNewsPage() {
  const { data: news } = await supabase
    .from("news")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <AdminLayout title="News verwalten" subtitle="Adminbereich">
      <div className="mb-8 flex justify-end">
        <Link
          href="/admin/news/new"
          className="rounded-full bg-red-600 px-6 py-3 font-bold transition hover:bg-red-700"
        >
          Neue News
        </Link>
      </div>

      <AdminNewsList news={news || []} />
    </AdminLayout>
  );
}
