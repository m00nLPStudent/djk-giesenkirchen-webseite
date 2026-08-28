import Link from "next/link";

export function formatNewsDate(date) {
  if (!date) return "Aktuell";
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export default function NewsCard({ item, featured = false, compactMeta = false }) {
  return (
    <Link href={`/news/${item.slug}`} className="group block h-full">
      <article className={`h-full overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#17171e]/95 shadow-[0_24px_65px_rgba(0,0,0,0.24)] transition duration-300 group-hover:-translate-y-1 group-hover:border-red-500/45 group-hover:bg-[#1b1b23] ${featured ? "lg:grid lg:grid-cols-[1.08fr_0.92fr]" : ""}`}>
        {item.imageUrl ? (
          <div className={`${featured ? "h-52 md:h-80 lg:h-full" : "h-44 sm:h-48 md:h-56"} bg-black/20 p-3 md:p-4`}>
            <img src={item.imageUrl} alt={item.title} className="h-full w-full rounded-[1.35rem] object-cover" />
          </div>
        ) : null}
        <div className={`${featured ? "flex h-full flex-col p-6 md:p-9" : "p-6"}`}>
          <div className="flex flex-wrap justify-end gap-3">
            <span className="rounded-full bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white shadow-[0_8px_24px_rgba(220,38,38,0.22)]">{item.categoryLabel}</span>
          </div>
          <h2 className={`${featured ? "mt-6 text-3xl sm:text-4xl md:mt-7 md:text-5xl" : "mt-5 text-2xl"} font-black leading-tight text-white`}>{item.title}</h2>
          {item.teaser ? <p className={`${featured ? "mt-5 text-base leading-7 md:mt-6 md:text-lg md:leading-8" : "mt-4 text-sm leading-6"} text-white/65`}>{item.teaser}</p> : null}
          <div className={`${featured ? "mt-auto border-t border-white/[0.08] pt-7" : "mt-6"} flex items-end justify-between gap-4`}>
            {featured && !compactMeta ? <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">{item.author || "DJK/VfL Giesenkirchen"}</p> : <span />}
            <div className="text-right">
              {featured && !compactMeta ? <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">{formatNewsDate(item.publishedAt)}</p> : null}
              <p className="mt-2 text-sm font-black uppercase tracking-[0.22em] text-red-400">Weiterlesen</p>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
