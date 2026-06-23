import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function NewsPage() {
  const { data: news } = await supabase
    .from("news")
    .select("*")
    .eq("is_published", true)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });

  return (
    <main className="min-h-screen bg-[#101014] px-6 pt-32 pb-20 text-white">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
          Aktuelles
        </p>

        <h1 className="mt-6 text-6xl font-black">News</h1>

        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {news?.map((item) => (
            <Link href={`/news/${item.slug}`} key={item.id}>
              <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition hover:border-red-500/50 hover:bg-white/10">
                {item.image_url && (
                  <div className="flex h-56 items-center justify-center bg-white/5 p-6">
                    <img
                      src={item.image_url}
                      alt={item.title_de}
                      className="h-full w-full object-contain"
                    />
                  </div>
                )}

                <div className="p-6">
                  <p className="text-xs uppercase tracking-[0.25em] text-red-400">
                    {item.category}
                  </p>

                  <h2 className="mt-4 text-2xl font-black">{item.title_de}</h2>

                  <p className="mt-4 text-white/60">{item.teaser_de}</p>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
