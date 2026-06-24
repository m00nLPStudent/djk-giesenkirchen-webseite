import AdminNewsList from "@/components/AdminNewsList";
import DeleteNewsButton from "@/components/DeleteNewsButton";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default async function AdminNewsPage() {
  const { data: news } = await supabase
    .from("news")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-[#101014] px-6 pt-32 pb-20 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
              Adminbereich
            </p>

            <h1 className="mt-4 text-5xl font-black">News verwalten</h1>
          </div>

          <Link
            href="/admin/news/new"
            className="rounded-full bg-red-600 px-6 py-3 font-bold transition hover:bg-red-700"
          >
            Neue News
          </Link>
        </div>
        <AdminNewsList news={news || []} />
      </div>
    </main>
  );
}
