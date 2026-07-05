import Link from "next/link";
import { supabase } from "@/lib/supabase";
import NewsCard from "@/components/website/news/NewsCard";

const PAGE_SIZE = 6;

function getSafePage(value) {
  const page = Number(value || 1);
  if (Number.isNaN(page) || page < 1) return 1;
  return page;
}

function buildPageHref(page, search) {
  const params = new URLSearchParams();
  if (search) params.set("suche", search);
  if (page > 1) params.set("seite", String(page));
  const query = params.toString();
  return query ? `/news/uebersicht?${query}` : "/news/uebersicht";
}

export default async function NewsOverviewPage({ searchParams }) {
  const query = await searchParams;
  const search = String(query?.suche || "").trim();
  const page = getSafePage(query?.seite);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let newsQuery = supabase
    .from("news")
    .select("*, football_team:football_team_id(name_de)", { count: "exact" })
    .eq("is_published", true)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .range(from, to);

  if (search) {
    newsQuery = newsQuery.or(
      `title_de.ilike.%${search}%,teaser_de.ilike.%${search}%,content_de.ilike.%${search}%,category.ilike.%${search}%`,
    );
  }

  const { data: news, count } = await newsQuery;
  const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));

  return (
    <main className="min-h-screen bg-[#101014] px-4 pt-32 pb-20 text-white sm:px-6 md:pt-56 md:pb-24">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
              News Übersicht
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight md:text-7xl">
              Alle Meldungen
            </h1>
          </div>

          <form action="/news/uebersicht" className="w-full max-w-md">
            <label htmlFor="suche" className="sr-only">
              News suchen
            </label>
            <div className="rounded-full border border-white/10 bg-white/5 p-2 focus-within:border-red-500">
              <input
                id="suche"
                name="suche"
                defaultValue={search}
                placeholder="News suchen ..."
                className="w-full rounded-full bg-transparent px-5 py-3 text-sm font-bold text-white outline-none placeholder:text-white/35"
              />
            </div>
          </form>
        </div>

        {search && (
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <p className="text-sm text-white/55">
              Suchergebnisse für{" "}
              <span className="font-bold text-white">{search}</span>
            </p>
            <Link
              href="/news/uebersicht"
              className="rounded-full border border-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white/55 transition hover:border-red-500 hover:text-white"
            >
              Suche zurücksetzen
            </Link>
          </div>
        )}

        {news?.length ? (
          <>
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {news.map((item) => (
                <NewsCard item={item} key={item.id} compactMeta />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-12 flex flex-wrap justify-center gap-3">
                {Array.from({ length: totalPages }).map((_, index) => {
                  const pageNumber = index + 1;
                  const isActive = pageNumber === page;

                  return (
                    <Link
                      key={pageNumber}
                      href={buildPageHref(pageNumber, search)}
                      className={`flex h-11 w-11 items-center justify-center rounded-full border text-sm font-black transition ${
                        isActive
                          ? "border-red-500 bg-red-600 text-white"
                          : "border-white/10 bg-white/5 text-white/55 hover:border-red-500 hover:text-white"
                      }`}
                    >
                      {pageNumber}
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="mt-12 rounded-[2rem] border border-white/10 bg-white/5 p-8">
            <p className="text-lg text-white/65">
              Es wurden keine passenden News gefunden.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
