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
    <Link href={`/news/${item.slug}`} className="group block h-full min-w-0 w-full max-w-full">
      <article className={`h-full min-w-0 w-full max-w-full overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#17171e]/95 shadow-[0_24px_65px_rgba(0,0,0,0.24)] transition duration-300 group-hover:-translate-y-1 group-hover:border-red-500/45 group-hover:bg-[#1b1b23] ${featured ? "lg:grid lg:grid-cols-[1.08fr_0.92fr]" : ""}`}>
        {item.imageUrl ? (
          <div className={`${featured ? "h-40 sm:h-52 md:h-80 lg:h-full" : "h-44 sm:h-48 md:h-56"} min-w-0 w-full max-w-full bg-black/20 p-2.5 sm:p-3 md:p-4`}>
            <img src={item.imageUrl} alt={item.title} className="h-full w-full rounded-[1.35rem] object-cover" />
          </div>
        ) : null}
        <div className={`${featured ? "flex h-full min-w-0 flex-col p-4 sm:p-6 md:p-9" : "min-w-0 p-6"}`}>
          <div className="flex min-w-0 flex-wrap justify-start gap-3 sm:justify-end">
            <span className={`max-w-full break-words rounded-full bg-red-600 text-center font-black uppercase text-white shadow-[0_8px_24px_rgba(220,38,38,0.22)] ${featured ? "px-3 py-1.5 text-[0.65rem] tracking-[0.16em] sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.2em]" : "px-4 py-2 text-xs tracking-[0.2em]"}`}>{item.categoryLabel}</span>
          </div>
          <h2 className={`${featured ? "mt-4 text-2xl sm:mt-6 sm:text-4xl md:mt-7 md:text-5xl" : "mt-5 text-2xl"} break-words font-black leading-tight text-white`}>{item.title}</h2>
          {item.teaser ? <p className={`${featured ? "mt-3 line-clamp-3 text-sm leading-6 sm:mt-5 sm:line-clamp-none sm:text-base sm:leading-7 md:mt-6 md:text-lg md:leading-8" : "mt-4 text-sm leading-6"} text-white/65`}>{item.teaser}</p> : null}
          <div className={`${featured ? "mt-4 border-t border-white/[0.08] pt-4 sm:mt-auto sm:pt-7" : "mt-6"} flex flex-wrap items-end justify-between gap-3 sm:gap-4`}>
            {featured && !compactMeta ? <p className="min-w-0 break-words text-xs font-bold uppercase tracking-[0.2em] text-white/45">{item.author || "DJK/VfL Giesenkirchen"}</p> : <span />}
            <div className="min-w-0 text-right">
              {featured && !compactMeta ? <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">{formatNewsDate(item.publishedAt)}</p> : null}
              <p className="mt-2 text-sm font-black uppercase tracking-[0.22em] text-red-400">Weiterlesen</p>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
