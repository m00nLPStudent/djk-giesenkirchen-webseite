import Link from "next/link";

export default function TeamSeasonSelector({ baseSlug, seasons = [], selectedSeason }) {
  if (!seasons.length) return null;

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 md:p-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
            Saison
          </p>
          <h2 className="mt-3 text-3xl font-black">Saison auswählen</h2>
          <p className="mt-3 text-sm leading-6 text-white/55">
            Wähle aus, für welche Saison du diese Mannschaft anzeigen möchtest.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {seasons.map((season) => {
            const isSelected = season.id === selectedSeason?.id;
            const href = season.is_current
              ? `/fussball/${baseSlug}`
              : `/fussball/${baseSlug}?saison=${season.slug}`;

            return (
              <Link
                key={season.id}
                href={href}
                className={`rounded-full border px-5 py-3 text-sm font-black transition ${
                  isSelected
                    ? "border-red-500 bg-red-600 text-white"
                    : "border-white/10 bg-black/20 text-white/70 hover:border-red-500 hover:text-white"
                }`}
              >
                {season.name}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
