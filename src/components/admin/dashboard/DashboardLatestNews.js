import Link from "next/link";

export default function DashboardLatestNews({ news = [] }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-2xl font-black">Letzte News</h2>

      <div className="mt-6 space-y-4">
        {news.length ? (
          news.map((item) => (
            <Link
              key={item.id}
              href={`/admin/news/edit/${item.id}`}
              className="block rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-red-500/50"
            >
              <p className="font-bold">{item.title_de}</p>

              <p className="mt-1 text-sm text-white/50">
                {item.category || "Allgemein"}
              </p>
            </Link>
          ))
        ) : (
          <p className="text-white/50">Noch keine News vorhanden.</p>
        )}
      </div>
    </section>
  );
}
