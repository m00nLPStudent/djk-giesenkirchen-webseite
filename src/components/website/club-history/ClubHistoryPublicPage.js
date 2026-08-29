/* eslint-disable @next/next/no-img-element */
import RichTextContent from "@/components/website/content/RichTextContent";
import { loadPublicMediaUrlMap } from "@/components/admin/media-library/media.service";
import { CLUB_HISTORY_PAGE_KEY } from "@/components/admin/club-history/services/clubHistory.service";
import { PublicCard, PublicPageHero, PublicPageShell } from "@/components/website/layout";
import { supabase } from "@/lib/supabase";
import { decodeHistoryTextEntities, formatHistoryYearRange, isPublicClubHistoryPage, pickLocalizedHistoryValue } from "./clubHistoryPublic.core.mjs";

function EmptyHistory() {
  return <PublicPageShell width="max-w-5xl"><PublicPageHero eyebrow="Gesamtverein" title="Vereinsgeschichte" description="Die Vereinsgeschichte ist derzeit noch nicht veröffentlicht." /></PublicPageShell>;
}

export default async function ClubHistoryPublicPage() {
  const { data: page } = await supabase.from("club_history_pages").select("*").eq("page_key", CLUB_HISTORY_PAGE_KEY).eq("is_active", true).eq("is_published", true).maybeSingle();
  if (!isPublicClubHistoryPage(page)) return <EmptyHistory />;

  const [imagesResult, milestonesResult] = await Promise.all([
    supabase.from("club_history_images").select("*").eq("club_history_page_id", page.id).eq("is_active", true).order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
    supabase.from("club_history_milestones").select("*").eq("club_history_page_id", page.id).eq("is_active", true).order("milestone_year", { ascending: true }).order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
  ]);
  const imageRows = imagesResult.data || [];
  const mediaUrls = await loadPublicMediaUrlMap(imageRows.map((image) => image.media_asset_id), "image");
  const images = imageRows.map((image) => ({ ...image, resolvedImageUrl: image.media_asset_id ? mediaUrls.data.get(image.media_asset_id) || image.image_url || null : image.image_url || null })).filter((image) => image.resolvedImageUrl);
  const milestones = milestonesResult.data || [];
  const title = decodeHistoryTextEntities(pickLocalizedHistoryValue(page.title_de, page.title_en, "Vereinsgeschichte"));
  const teaser = decodeHistoryTextEntities(pickLocalizedHistoryValue(page.teaser_de, page.teaser_en));
  const content = decodeHistoryTextEntities(pickLocalizedHistoryValue(page.content_de, page.content_en));

  return (
    <PublicPageShell>
      <PublicPageHero eyebrow="Gesamtverein" title={title} description={teaser} />
      {content ? <PublicCard as="article" className="mt-10 p-6 md:p-10"><RichTextContent content={content} /></PublicCard> : null}
      {images.length ? (
        <section className="mt-10" aria-labelledby="club-history-images">
          <h2 id="club-history-images" className="text-3xl font-black md:text-4xl">Bilder</h2>
          <div className="mt-6 grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {images.map((image) => (
              <figure key={image.id} className="min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-[#18181f]/90">
                <img src={image.resolvedImageUrl} alt={decodeHistoryTextEntities(pickLocalizedHistoryValue(image.alt_text_de, image.alt_text_en, title))} className="h-64 w-full object-cover" />
                {pickLocalizedHistoryValue(image.caption_de, image.caption_en) ? <figcaption className="px-5 py-4 text-sm text-white/65">{decodeHistoryTextEntities(pickLocalizedHistoryValue(image.caption_de, image.caption_en))}</figcaption> : null}
              </figure>
            ))}
          </div>
        </section>
      ) : null}
      {milestones.length ? (
        <PublicCard as="section" className="mt-10 p-7 md:p-9" aria-labelledby="club-history-milestones">
          <h2 id="club-history-milestones" className="text-2xl font-black md:text-3xl">Meilensteine</h2>
          <div className="relative mt-7 pl-8 md:pl-12">
            <div className="absolute top-1 bottom-1 left-2.5 w-px bg-gradient-to-b from-red-500/85 via-red-400/60 to-red-800/15 md:left-4" />
            <div className="space-y-7">
              {milestones.map((item) => <article key={item.id} className="relative"><span className="absolute -left-[1.75rem] top-2.5 h-2.5 w-2.5 rounded-full border border-red-200/45 bg-red-500 shadow-[0_0_0_4px_rgba(196,0,26,0.12)] md:-left-[2.25rem]" /><p className="text-3xl font-black leading-none text-red-400 md:text-4xl">{formatHistoryYearRange(item.milestone_year, item.milestone_year_until)}</p>{pickLocalizedHistoryValue(item.title_de, item.title_en) ? <h3 className="mt-3 text-lg font-black text-white">{decodeHistoryTextEntities(pickLocalizedHistoryValue(item.title_de, item.title_en))}</h3> : null}<p className="mt-2.5 max-w-4xl whitespace-pre-line break-words text-base leading-7 text-white/70">{decodeHistoryTextEntities(pickLocalizedHistoryValue(item.description_de, item.description_en))}</p></article>)}
            </div>
          </div>
        </PublicCard>
      ) : null}
    </PublicPageShell>
  );
}
