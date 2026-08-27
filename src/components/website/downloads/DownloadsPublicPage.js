export default function DownloadsPublicPage({ groups = [] }) {
  return (
    <main className="min-h-screen bg-[#101014] px-4 pb-20 pt-28 text-white sm:px-6 md:pb-24 md:pt-32">
      <section className="mx-auto max-w-6xl">
        <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">Verein</p>
        <h1 className="mt-4 text-4xl font-black md:text-7xl">Downloads</h1>
        <p className="mt-6 max-w-3xl text-base leading-7 text-white/70 md:text-lg md:leading-8">
          Hier findest du wichtige Dokumente, Formulare und Informationen des DJK/VfL Giesenkirchen zum Herunterladen.
        </p>

        {groups.length ? (
          <div className="mt-12 space-y-10">
            {groups.map((group) => (
              <section key={group.id} aria-labelledby={`download-category-${group.id}`}>
                <h2 id={`download-category-${group.id}`} className="border-b border-white/15 pb-3 text-2xl font-black md:text-3xl">{group.name}</h2>
                <div className="divide-y divide-white/10">
                  {group.downloads.map((item) => (
                    <article key={item.id} className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-white">{item.title}</h3>
                        {item.description && <p className="mt-1 max-w-3xl text-sm leading-6 text-white/65">{item.description}</p>}
                        <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-white/45">PDF{item.fileSize ? ` · ${item.fileSize}` : ""}</p>
                      </div>
                      <a href={item.href} className="inline-flex shrink-0 items-center justify-center rounded-full bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400" aria-label={`${item.title} herunterladen`}>
                        Herunterladen
                      </a>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-6 text-white/65 md:p-8">Aktuell stehen keine Downloads zur Verfügung.</div>
        )}
      </section>
    </main>
  );
}
