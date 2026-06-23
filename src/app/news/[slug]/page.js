import { supabase } from "@/lib/supabase";

export default async function NewsDetailPage({ params }) {
  const { slug } = await params;

  const { data: article } = await supabase
    .from("news")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .lte("published_at", new Date().toISOString())
    .single();

  if (!article) {
    return (
      <main className="min-h-screen bg-[#101014] pt-32 text-white">
        <div className="mx-auto max-w-4xl px-6">
          <h1 className="text-5xl font-black">Artikel nicht gefunden</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#101014] text-white">
      <section className="px-6 pt-32 pb-20">
        <div className="mx-auto max-w-5xl">
          {article.image_url && (
            <img
              src={article.image_url}
              alt={article.title_de}
              className="mb-10 max-h-[420px] w-full rounded-3xl object-contain bg-white/5 p-8"
            />
          )}

          <p className="text-sm uppercase tracking-[0.35em] text-red-400">
            {article.category}
          </p>

          <h1 className="mt-4 text-6xl font-black">{article.title_de}</h1>

          <div className="mt-6 flex gap-6 text-white/60">
            <span>{article.author}</span>
            <span>
              {new Date(article.published_at).toLocaleDateString("de-DE")}
            </span>
          </div>

          <div className="mt-12 text-lg leading-9 text-white/80">
            {article.content_de}
          </div>
        </div>
      </section>
    </main>
  );
}
