import { supabase } from "@/lib/supabase";
import RichTextContent from "@/components/website/content/RichTextContent";

function isPublishedNow(page) {
  if (!page?.is_active || !page?.is_published) return false;
  if (!page.published_at) return true;
  return new Date(page.published_at).getTime() <= Date.now();
}

function pickDeFirst(deValue, enValue, fallback = "") {
  const de = typeof deValue === "string" ? deValue.trim() : deValue;
  const en = typeof enValue === "string" ? enValue.trim() : enValue;

  if (de) return de;
  if (en) return en;
  return fallback;
}

function formatYearRange(from, to) {
  const yearFrom = Number(from || 0);
  const yearTo = Number(to || 0);

  if (!yearFrom) return "-";
  if (!yearTo || yearTo === yearFrom) return String(yearFrom);
  return `${yearFrom}-${yearTo}`;
}

function Placeholder() {
  return (
    <main className="min-h-screen bg-[#101014] px-6 pt-40 pb-24 text-white md:pt-52">
      <section className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-white/5 p-10 md:p-12">
        <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
          Fußballabteilung
        </p>
        <h1 className="mt-4 text-3xl font-black leading-tight md:text-5xl">
          Vereinsgeschichte
        </h1>
        <p className="mt-6 text-lg leading-8 text-white/70">
          Die Inhalte zur Vereinsgeschichte werden aktuell vorbereitet und in
          Kürze veröffentlicht.
        </p>
        <p className="mt-4 text-lg leading-8 text-white/70">
          Vielen Dank für eure Geduld.
        </p>
      </section>
    </main>
  );
}

export default async function ClubHistoryPublicPage() {
  const { data: keyedPage } = await supabase
    .from("club_history_pages")
    .select("*")
    .eq("page_key", "fussball-vereinsgeschichte")
    .eq("is_active", true)
    .eq("is_published", true)
    .maybeSingle();

  const page = keyedPage
    ? keyedPage
    : (
        await supabase
          .from("club_history_pages")
          .select("*")
          .eq("is_active", true)
          .eq("is_published", true)
          .order("updated_at", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      ).data;

  if (!isPublishedNow(page)) {
    return <Placeholder />;
  }

  const pageId = page.id;
  const pageTitle = pickDeFirst(
    page.title_de,
    page.title_en,
    "Vereinsgeschichte",
  );
  const pageTeaser = pickDeFirst(page.teaser_de, page.teaser_en, "");
  const pageContent = pickDeFirst(page.content_de, page.content_en, "");

  const [imagesResult, milestonesResult] = await Promise.all([
    supabase
      .from("club_history_images")
      .select("*")
      .eq("club_history_page_id", pageId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("club_history_milestones")
      .select("*")
      .eq("club_history_page_id", pageId)
      .eq("is_active", true)
      .order("milestone_year", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  const images = imagesResult?.data || [];
  const milestones = milestonesResult?.data || [];

  return (
    <main className="min-h-screen bg-[#101014] px-6 pt-40 pb-24 text-white md:pt-52">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 md:p-12">
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
            Fußballabteilung
          </p>
          <h1 className="mt-5 text-3xl font-black leading-tight md:text-5xl">
            {pageTitle}
          </h1>

          {pageTeaser && (
            <p className="mt-6 max-w-4xl text-lg leading-8 text-white/70">
              {pageTeaser}
            </p>
          )}
        </div>

        <article className="mt-10 rounded-3xl border border-white/10 bg-black/20 p-8 md:p-10">
          <RichTextContent content={pageContent} />
        </article>

        {images.length > 0 && (
          <section className="mt-10">
            <h2 className="text-3xl font-black md:text-4xl">Bilder</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {images.map((image) => (
                <figure
                  key={image.id}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/5"
                >
                  <img
                    src={image.image_url}
                    alt={pickDeFirst(
                      image.alt_text_de,
                      image.alt_text_en,
                      pageTitle,
                    )}
                    className="h-64 w-full object-cover"
                  />
                  {pickDeFirst(image.caption_de, image.caption_en, "") && (
                    <figcaption className="px-5 py-4 text-sm text-white/65">
                      {pickDeFirst(image.caption_de, image.caption_en, "")}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </section>
        )}

        {milestones.length > 0 && (
          <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-7 md:p-9">
            <h2 className="text-2xl font-black md:text-3xl">Meilensteine</h2>
            <div className="relative mt-7 pl-8 md:pl-12">
              <div className="absolute left-2.5 top-1 bottom-1 w-px bg-gradient-to-b from-red-500/85 via-red-400/60 to-red-800/15 md:left-4" />

              <div className="space-y-7">
                {milestones.map((item) => (
                  <article key={item.id} className="relative">
                    <span className="absolute -left-[1.75rem] top-2.5 h-2.5 w-2.5 rounded-full border border-red-200/45 bg-red-500 shadow-[0_0_0_4px_rgba(196,0,26,0.12)] md:-left-[2.25rem]" />

                    <p className="text-3xl font-black leading-none text-red-400 md:text-4xl">
                      {formatYearRange(
                        item.milestone_year,
                        item.milestone_year_until,
                      )}
                    </p>
                    <p className="mt-2.5 max-w-4xl whitespace-pre-line text-base leading-7 text-white/72">
                      {pickDeFirst(
                        item.description_de,
                        item.description_en,
                        "",
                      )}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
