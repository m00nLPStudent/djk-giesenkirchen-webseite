export default function TeamExternalEmbed({ title, description, url, emptyText }) {
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
          {emptyText}
        </div>
      )}
    </section>
  );
}
