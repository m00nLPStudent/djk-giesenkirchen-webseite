import Link from "next/link";
import { supabase } from "@/lib/supabase";
import NewsCard from "@/components/website/news/NewsCard";
import { loadNewsCategories } from "@/components/admin/news/services/newsCategories.repository";
import { createPublicNewsCardDto } from "@/components/admin/news/helpers/newsCategories.core";
import { resolvePublicNewsImages } from "@/components/admin/news/services/newsMedia.service";

export default async function NewsPage() {
  const { data: categories } = await loadNewsCategories(supabase, { activeOnly: false });
  const { data: latestNews } = await supabase
    .from("news")
    .select("*, football_team:football_team_id(name_de)")
    .eq("is_published", true)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(6);

  const newsCards = (await resolvePublicNewsImages(latestNews || [])).map((item) => createPublicNewsCardDto(item, categories || []));
  const featuredNews = newsCards[0];
  const secondaryNews = newsCards.slice(1);

  return (
    <main className="min-h-screen bg-[var(--dunkel)] px-4 pt-28 pb-20 text-white sm:px-6 md:pt-32 md:pb-24">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
              Aktuelles
            </p>
            <h1 className="mt-6 text-4xl font-black leading-tight md:text-6xl lg:text-7xl">
              Aktuelle News
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/65 md:text-lg md:leading-8">
              Die neuesten Meldungen aus dem Verein – deutlich dargestellt und
              direkt erreichbar.
            </p>
          </div>

          <Link
            href="/news/uebersicht"
            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-white/70 transition hover:border-red-500 hover:text-white"
          >
            Zur Übersicht
          </Link>
        </div>

        {featuredNews ? (
          <div className="mt-12 space-y-8">
            <NewsCard item={featuredNews} featured />

            {secondaryNews.length > 0 && (
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {secondaryNews.map((item) => (
                  <NewsCard item={item} key={item.id} compactMeta />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-12 rounded-[2rem] border border-white/10 bg-white/5 p-8">
            <p className="text-lg text-white/65">
              Aktuell sind noch keine News veröffentlicht.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
