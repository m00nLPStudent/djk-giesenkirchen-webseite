import Link from "next/link";
import { supabase } from "@/lib/supabase";

function formatDate(value) {
  if (!value) return "Aktuell";

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function NewsCard({ item, featured = false }) {
  return (
    <Link href={`/news/${item.slug}`} className="group block h-full">
      <article
        className={`h-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 transition group-hover:-translate-y-1 group-hover:border-red-500/50 group-hover:bg-white/10 ${
          featured ? "lg:grid lg:grid-cols-[1.05fr_0.95fr]" : ""
        }`}
      >
        {item.image_url && (
          <div className={`${featured ? "h-72 lg:h-full" : "h-56"} bg-white/5 p-5`}>
            <img
              src={item.image_url}
              alt={item.title_de}
              className="h-full w-full rounded-[1.5rem] object-cover"
            />
          </div>
        )}

        <div className={`${featured ? "p-8 md:p-10" : "p-6"}`}>
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white">
              {item.category || "Verein"}
            </span>
            <span className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/50">
              {formatDate(item.published_at)}
            </span>
          </div>

          <h2 className={`${featured ? "mt-7 text-4xl md:text-5xl" : "mt-5 text-2xl"} font-black leading-tight text-white`}>
            {item.title_de}
          </h2>

          {item.teaser_de && (
            <p className={`${featured ? "mt-6 text-lg leading-8" : "mt-4 text-sm leading-6"} text-white/65`}>
              {item.teaser_de}
            </p>
          )}

          <p className="mt-6 text-sm font-black uppercase tracking-[0.22em] text-red-400">
            Weiterlesen
          </p>
        </div>
      </article>
    </Link>
  );
}

export default async function Home() {
  const { data: teams, error } = await supabase
    .from("teams")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  const { data: latestNews } = await supabase
    .from("news")
    .select("*")
    .eq("is_published", true)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(4);

  const featuredNews = latestNews?.[0];
  const secondaryNews = latestNews?.slice(1) || [];

  return (
    <main className="min-h-screen bg-[#101014] text-white">
      <section className="relative overflow-hidden px-6 pt-32 pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#c4001a55,transparent_35%),linear-gradient(120deg,#101014_20%,#1b1b22_60%,#c4001a_140%)]" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
                Aktuelles aus dem Verein
              </p>
              <h1 className="mt-5 max-w-4xl text-5xl font-black leading-tight md:text-7xl">
                Neuigkeiten aus Giesenkirchen
              </h1>
            </div>

            <Link
              href="/news"
              className="w-fit rounded-full border border-white/20 px-5 py-3 text-sm font-bold uppercase tracking-wide text-white/80 transition hover:border-red-500 hover:text-white"
            >
              Alle News
            </Link>
          </div>

          {featuredNews ? (
            <div className="mt-12 space-y-8">
              <NewsCard item={featuredNews} featured />

              {secondaryNews.length > 0 && (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {secondaryNews.map((item) => (
                    <NewsCard item={item} key={item.id} />
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
        </div>
      </section>

      <section className="bg-[#101014] px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
            Fußballabteilung
          </p>

          <h2 className="mt-4 text-4xl font-black md:text-5xl">
            Unsere Mannschaften
          </h2>

          {error && (
            <p className="mt-6 text-red-400">
              Mannschaften konnten nicht geladen werden.
            </p>
          )}

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {teams?.map((team) => (
              <Link
                href={`/fussball/${team.slug}`}
                key={team.slug}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:bg-white/10"
              >
                <p className="text-xs uppercase tracking-[0.25em] text-white/50">
                  {team.age_group}
                </p>

                <h3 className="mt-4 min-h-[96px] text-2xl font-black leading-tight">
                  {team.name_de}
                </h3>

                <p className="mt-4 text-sm text-white/60">Mannschaft ansehen</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
