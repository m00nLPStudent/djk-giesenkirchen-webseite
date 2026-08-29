import { supabase } from "@/lib/supabase";
import NewsCard from "@/components/website/news/NewsCard";
import { loadNewsCategories } from "@/components/admin/news/services/newsCategories.repository";
import { createPublicNewsCardDto } from "@/components/admin/news/helpers/newsCategories.core";
import { resolvePublicNewsImages } from "@/components/admin/news/services/newsMedia.service";
import { loadEventTypes } from "@/components/admin/events/services/eventTypes.repository";
import { createEventDtos } from "@/components/admin/events/helpers/eventTypes.core";
import { HomeEventsSection } from "@/components/website/events";
import { getVirtualTrainingEvents } from "@/lib/events";
import { selectUpcomingHomeTrainings } from "@/lib/events/homeTrainingEvents.mjs";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [{ data: categories }, { data: eventTypes }] = await Promise.all([
    loadNewsCategories(supabase, { activeOnly: false }),
    loadEventTypes(supabase, { activeOnly: false }),
  ]);
  const { data: latestNews } = await supabase
    .from("news")
    .select("*, football_team:football_team_id(name_de)")
    .eq("is_published", true)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(4);

  const newsCards = (await resolvePublicNewsImages(latestNews || [])).map((item) => createPublicNewsCardDto(item, categories || []));
  const featuredNews = newsCards[0];
  const secondaryNews = newsCards.slice(1, 4);

  const now = new Date();
  const trainingEvents = await getVirtualTrainingEvents({
    from: now,
    to: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
    maxOccurrencesPerTraining: 180,
  });
  const upcomingTrainings = createEventDtos(
    selectUpcomingHomeTrainings(trainingEvents, { now }),
    eventTypes || [],
  );

  return (
    <main className="public-home-page min-h-screen bg-[#101014] text-white">
      <section className="relative overflow-hidden px-4 pt-28 pb-20 sm:px-6 xl:pt-48 xl:pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(220,38,38,0.2),transparent_31%),radial-gradient(circle_at_86%_44%,rgba(220,38,38,0.08),transparent_28%),linear-gradient(120deg,#101014_15%,#18181f_68%,#211116_135%)]" />

        <div className="relative z-10 mx-auto max-w-[90rem] min-w-0">
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
              Aktuelles aus dem Verein
            </p>
            <h1 className="mt-5 max-w-4xl break-words text-3xl font-black leading-[1.1] sm:text-4xl md:text-6xl lg:text-7xl">
              Neuigkeiten aus Giesenkirchen
            </h1>
          </div>

          <div className="mt-8 grid min-w-0 grid-cols-[minmax(0,1fr)] items-start gap-8 sm:mt-12 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_27rem]">
            <div className="min-w-0 space-y-8">
              {featuredNews ? (
                <>
                  <NewsCard item={featuredNews} featured />
                  {secondaryNews.length > 0 && (
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                      {secondaryNews.map((item) => <NewsCard item={item} key={item.id} compactMeta />)}
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 md:p-8">
                  <p className="text-base text-white/65 md:text-lg">Aktuell sind noch keine News veröffentlicht.</p>
                </div>
              )}
            </div>
            <HomeEventsSection events={upcomingTrainings} compact />
          </div>
        </div>
      </section>
    </main>
  );
}
