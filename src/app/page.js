import WebsiteLayout from "@/components/website/WebsiteLayout";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function Home() {
  const { data: teams, error } = await supabase
    .from("teams")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  const { data: latestNews } = await supabase
    .from("news")
    .select("*")
    .eq("is_published", true)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(3);

  return (
    <WebsiteLayout>
      <main className="min-h-screen bg-[#101014] text-white">
        <section className="relative flex min-h-screen items-center overflow-hidden px-6 pt-28">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#c4001a55,transparent_35%),linear-gradient(120deg,#101014_20%,#1b1b22_60%,#c4001a_140%)]" />

          <div className="relative z-10 mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.35em] text-red-400">
                Fußball • Tischtennis • Damen-Gymnastik
              </p>

              <h2 className="max-w-3xl text-5xl font-black leading-tight md:text-7xl">
                Gemeinsam.
                <br />
                Stark.
                <br />
                Giesenkirchen.
              </h2>

              <p className="mt-6 max-w-xl text-lg leading-8 text-white/75">
                Die moderne Vereinsplattform der DJK/VfL Giesenkirchen 05/09
                e.V. mit aktuellen News, Mannschaften, Terminen, Galerien und
                allem rund um unseren Verein.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[#101014] px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
              Aktuelles
            </p>

            <div className="mt-4 flex items-end justify-between gap-6">
              <h2 className="text-4xl font-black md:text-5xl">Neueste News</h2>

              <Link
                href="/news"
                className="hidden rounded-full border border-white/20 px-5 py-3 text-sm font-bold uppercase tracking-wide text-white/80 md:block"
              >
                Alle News
              </Link>
            </div>

            <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {latestNews?.map((item) => (
                <Link href={`/news/${item.slug}`} key={item.id}>
                  <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition hover:border-red-500/50 hover:bg-white/10">
                    {item.image_url && (
                      <div className="flex h-56 items-center justify-center bg-white/5 p-6">
                        <img
                          src={item.image_url}
                          alt={item.title_de}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    )}

                    <div className="p-6">
                      <p className="text-xs uppercase tracking-[0.25em] text-red-400">
                        {item.category}
                      </p>

                      <h3 className="mt-4 text-2xl font-black">
                        {item.title_de}
                      </h3>

                      <p className="mt-4 text-white/60">{item.teaser_de}</p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#101014] px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
              Fußballabteilung
            </p>

            <h2 className="mt-4 text-4xl font-black md:text-5xl">
              Unsere Mannschaften
            </h2>

            {error && (
              <p className="mt-6 text-red-400">
                Mannschaften konnten nicht geladen werden.
              </p>
            )}

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {teams?.map((team) => (
                <Link
                  href={`/fussball/${team.slug}`}
                  key={team.slug}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:bg-white/10"
                >
                  <p className="text-xs uppercase tracking-[0.25em] text-white/50">
                    {team.age_group}
                  </p>

                  <h3 className="mt-4 min-h-[96px] text-2xl font-black leading-tight">
                    {team.name_de}
                  </h3>

                  <p className="mt-4 text-sm text-white/60">
                    Mannschaft ansehen
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </WebsiteLayout>
  );
}
