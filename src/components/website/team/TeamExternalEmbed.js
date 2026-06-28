export default function TeamExternalEmbed({
  title,
  description,
  url,
  sourceUrl,
  emptyText,
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 md:p-8">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
          fussball.de
        </p>
        <h2 className="mt-3 text-3xl font-black">{title}</h2>
        {description && (
          <p className="mt-3 text-sm leading-6 text-white/55">{description}</p>
        )}
      </div>

      {url ? (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white">
          <iframe
            src={url}
            title={title}
            className="h-[620px] w-full"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="rounded-3xl border border-white/10 bg-black/20 p-6 text-white/55">
          <p>{emptyText}</p>

          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              className="mt-5 inline-flex rounded-full border border-white/10 px-5 py-3 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white"
            >
              Offizielle fussball.de-Seite öffnen
            </a>
          )}
        </div>
      )}
    </section>
  );
}
