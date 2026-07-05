import { supabase } from "@/lib/supabase";
import NewsCard from "@/components/website/news/NewsCard";
import { HomeEventsSection } from "@/components/website/events";
import {
  expandRecurringEvents,
  getVirtualTrainingEvents,
  mergeEventsWithVirtualTrainings,
} from "@/lib/events";

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

  const { data: publishedEvents } = await supabase
    .from("events")
    .select("*")
    .eq("is_published", true)
    .order("starts_at", { ascending: true })
    .limit(120);

  const now = new Date();
  const from = now;
  const to = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  const expandedEvents = expandRecurringEvents(publishedEvents || [], {
    from,
    to,
    maxOccurrencesPerEvent: 180,
  });
  const upcomingEventsOnly = expandedEvents.filter(
    (event) => new Date(event.starts_at) >= now,
  );
  const virtualTrainings = await getVirtualTrainingEvents({
    from,
    to,
    maxOccurrencesPerTraining: 180,
  });
  const mergedUpcomingEvents = mergeEventsWithVirtualTrainings(
    upcomingEventsOnly,
    virtualTrainings,
  ).slice(0, 4);

  return (
    <main className="min-h-screen bg-[#101014] text-white">
      <section className="relative overflow-hidden px-4 pt-28 pb-20 sm:px-6 md:pt-56 md:pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#c4001a55,transparent_35%),linear-gradient(120deg,#101014_20%,#1b1b22_60%,#c4001a_140%)]" />

        <div className="relative z-10 mx-auto max-w-7xl min-w-0">
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
              Aktuelles aus dem Verein
            </p>
            <h1 className="mt-5 max-w-4xl break-words text-3xl font-black leading-[1.1] sm:text-4xl md:text-6xl lg:text-7xl">
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
            <div className="mt-12 rounded-[2rem] border border-white/10 bg-white/5 p-6 md:p-8">
              <p className="text-base text-white/65 md:text-lg">
                Aktuell sind noch keine News veröffentlicht.
              </p>
            </div>
          )}
        </div>
      </section>

      <HomeEventsSection events={mergedUpcomingEvents} />
    </main>
  );
}
