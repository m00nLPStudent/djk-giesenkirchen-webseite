import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatFileSize } from "@/lib/files";
import { formatGermanDate } from "@/lib/dates";
import { getNewsCategoryDisplay } from "@/components/website/news/NewsCard";

export default async function NewsDetailPage({ params }) {
  const { slug } = await params;

  const { data: article } = await supabase
    .from("news")
    .select("*, football_team:football_team_id(name_de), news_documents(*)")
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

  const documents = (article.news_documents || [])
    .filter((document) => document.is_public)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  return (
    <main className="min-h-screen bg-[#101014] text-white">
      <section className="px-6 pt-32 pb-20">
        <div className="mx-auto max-w-5xl">
          {article.image_url && (
            <img
              src={article.image_url}
              alt={article.title_de}
              className="mb-10 max-h-[420px] w-full rounded-3xl bg-white/5 object-contain p-8"
            />
          )}

          <p className="text-sm uppercase tracking-[0.35em] text-red-400">
            {getNewsCategoryDisplay(article)}
          </p>

          <h1 className="mt-4 text-6xl font-black">{article.title_de}</h1>

          <div className="mt-6 flex gap-6 text-white/60">
            <span>{article.author}</span>
            <span>{formatGermanDate(article.published_at)}</span>
          </div>

          <div className="mt-12 text-lg leading-9 text-white/80">
            {article.content_de}
          </div>

          {documents.length > 0 && (
            <div className="mt-10">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
                {documents.length > 1 ? "Downloads" : "Download"}
              </h2>

              <ul className="mt-3 space-y-2">
                {documents.map((document) => {
                  const fileSize = formatFileSize(document.file_size);

                  return (
                    <li key={document.id}>
                      <Link
                        href={document.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-3 py-1 text-sm text-white/80 transition hover:text-red-400"
                      >
                        <span className="truncate">
                          {document.display_name_de ||
                            document.file_name ||
                            "Download"}
                        </span>
                        {fileSize && (
                          <span className="shrink-0 text-xs uppercase tracking-[0.2em] text-white/40">
                            {fileSize}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
