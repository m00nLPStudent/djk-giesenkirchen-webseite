import { supabase } from "@/lib/supabase";
import NewsCard from "@/components/website/news/NewsCard";
import { HomeEventsSection } from "@/components/website/events";
import { getUpcomingPublishedEvents } from "@/components/admin/events/services/events.service";

export default async function Home() {
  const { data: latestNews } = await supabase
    .from("news")
    .select("*, football_team:football_team_id(name_de)")
    .eq("is_published", true)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(4);

  const featuredNews = latestNews?.[0];
  const secondaryNews = latestNews?.slice(1, 4) || [];
  const { data: upcomingEvents } = await getUpcomingPublishedEvents(4);

  return (
    <main className="min-h-screen bg-[#101014] text-white">
      <section className="relative overflow-hidden px-6 pt-48 pb-24 md:pt-56">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#c4001a55,transparent_35%),linear-gradient(120deg,#101014_20%,#1b1b22_60%,#c4001a_140%)]" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
              Aktuelles aus dem Verein
            </p>
            <h1 className="mt-5 max-w-4xl text-5xl font-black leading-tight md:text-7xl">
              Neuigkeiten aus Giesenkirchen
            </h1>
          </div>

          {featuredNews ? (
            <div className="mt-12 space-y-8">
              <NewsCard item={featuredNews} featured />
              {secondaryNews.length > 0 && (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
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
        </div>
      </section>

      <HomeEventsSection events={upcomingEvents || []} />
    </main>
  );
}
