import Link from "next/link";
import { CalendarClock } from "lucide-react";

export default function DashboardPlannedNews({ news = [] }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-500/20 text-yellow-400">
          <CalendarClock size={24} />
        </div>

        <div>
          <h2 className="text-2xl font-black">Geplante News</h2>
          <p className="text-sm text-white/50">
            Noch nicht veröffentlichte Beiträge
          </p>
        </div>
      </div>

      {news.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-white/40">
          Keine geplanten News vorhanden.
        </div>
      ) : (
        <div className="space-y-4">
          {news.map((item) => (
            <Link
              key={item.id}
              href={`/admin/news/edit/${item.id}`}
              className="block rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-yellow-500 hover:bg-white/5"
            >
              <p className="font-bold">{item.title_de}</p>

              <p className="mt-2 text-sm text-white/50">Veröffentlichung:</p>

              <p className="text-sm text-yellow-400">
                {new Date(item.published_at).toLocaleString("de-DE")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
