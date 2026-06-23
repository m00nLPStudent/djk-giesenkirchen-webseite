import DeleteNewsButton from "@/components/DeleteNewsButton";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default async function AdminNewsPage() {
  const { data: news } = await supabase
    .from("news")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-[#101014] px-6 pt-32 pb-20 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
              Adminbereich
            </p>

            <h1 className="mt-4 text-5xl font-black">News verwalten</h1>
          </div>

          <Link
            href="/admin/news/new"
            className="rounded-full bg-red-600 px-6 py-3 font-bold transition hover:bg-red-700"
          >
            Neue News
          </Link>
        </div>

        <div className="mt-12 space-y-5">
          {news?.map((item) => (
            <div
              key={item.id}
              className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-red-500/50 hover:bg-white/10 md:grid-cols-[180px_1fr]"
            >
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
                    {item.category || "Allgemein"}
                  </span>

                  {(() => {
                    const now = new Date();

                    if (
                      item.published_at &&
                      new Date(item.published_at) > now
                    ) {
                      return (
                        <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">
                          Geplant
                        </span>
                      );
                    }

                    if (!item.is_published) {
                      return (
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                          Entwurf
                        </span>
                      );
                    }

                    return (
                      <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-green-400">
                        Veröffentlicht
                      </span>
                    );
                  })()}

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
                    className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white/70"
                  >
                    Bearbeiten
                  </Link>

                  <DeleteNewsButton id={item.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
