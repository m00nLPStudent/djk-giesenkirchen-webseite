import Link from "next/link";

export function formatNewsDate(value) {
  if (!value) return "Aktuell";

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function getFootballTeamName(item = {}) {
  if (item.football_team?.name_de) return item.football_team.name_de;
  if (item.teams?.name_de) return item.teams.name_de;
  if (Array.isArray(item.teams) && item.teams[0]?.name_de)
    return item.teams[0].name_de;
  return "";
}

export function getNewsCategoryDisplay(item = {}) {
  const category = item.category || "Allgemein";
  const teamName = getFootballTeamName(item);

  if (item.category_key === "fussball" && teamName) {
    return `Fußball · ${teamName}`;
  }

  return category;
}

export default function NewsCard({
  item,
  featured = false,
  compactMeta = false,
}) {
  return (
    <Link href={`/news/${item.slug}`} className="group block h-full">
      <article
        className={`h-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 transition group-hover:-translate-y-1 group-hover:border-red-500/50 group-hover:bg-white/10 ${
          featured ? "lg:grid lg:grid-cols-[1.05fr_0.95fr]" : ""
        }`}
      >
        {item.image_url && (
          <div
            className={`${featured ? "h-48 md:h-72 lg:h-full" : "h-44 sm:h-48 md:h-56"} bg-white/5 p-4 md:p-5`}
          >
            <img
              src={item.image_url}
              alt={item.title_de}
              className="h-full w-full rounded-[1.5rem] object-cover"
            />
          </div>
        )}

        <div
          className={`${featured ? "flex h-full flex-col p-6 md:p-10" : "p-6"}`}
        >
          <div className="flex flex-wrap justify-end gap-3">
            <span className="rounded-full bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white">
              {getNewsCategoryDisplay(item)}
            </span>
          </div>

          <h2
            className={`${featured ? "mt-6 text-3xl sm:text-4xl md:mt-7 md:text-5xl" : "mt-5 text-2xl"} font-black leading-tight text-white`}
          >
            {item.title_de}
          </h2>

          {item.teaser_de && (
            <p
              className={`${featured ? "mt-5 text-base leading-7 md:mt-6 md:text-lg md:leading-8" : "mt-4 text-sm leading-6"} text-white/65`}
            >
              {item.teaser_de}
            </p>
          )}

          <div
            className={`${featured ? "mt-auto pt-8" : "mt-6"} flex items-end justify-between gap-4`}
          >
            {featured && !compactMeta ? (
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">
                {item.author || "DJK/VfL Giesenkirchen"}
              </p>
            ) : (
              <span />
            )}

            <div className="text-right">
              {featured && !compactMeta && (
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">
                  {formatNewsDate(item.published_at)}
                </p>
              )}
              <p className="mt-2 text-sm font-black uppercase tracking-[0.22em] text-red-400">
                Weiterlesen
              </p>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
