import Link from "next/link";
import NewsStatusBadge from "./NewsStatusBadge";
import DeleteNewsButton from "@/components/admin/ui/DeleteNewsButton";
import { getNewsCategoryDisplay } from "@/components/website/news/NewsCard";

export default function NewsCard({ item }) {
  return (
    <div className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-red-500/50 hover:bg-white/10 md:grid-cols-[180px_1fr]">
      <div className="flex h-32 items-center justify-center overflow-hidden rounded-2xl bg-white/5 p-4">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title_de}
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="text-sm text-white/40">Kein Bild</span>
        )}
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-red-600/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-red-400">
            {getNewsCategoryDisplay(item)}
          </span>

          <NewsStatusBadge
            isPublished={item.is_published}
            publishedAt={item.published_at}
          />

          <span className="text-sm text-white/40">
            {item.published_at
              ? new Date(item.published_at).toLocaleString("de-DE")
              : "Kein Veröffentlichungsdatum"}
          </span>

          <span className="text-sm text-white/40">{item.author}</span>
        </div>

        <h2 className="mt-4 text-2xl font-black">{item.title_de}</h2>

        <p className="mt-3 max-w-3xl text-white/60">{item.teaser_de}</p>

        <div className="mt-5 flex gap-3">
          <Link
            href={`/admin/news/edit/${item.id}`}
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white"
          >
            Bearbeiten
          </Link>

          <DeleteNewsButton id={item.id} />
        </div>
      </div>
    </div>
  );
}
