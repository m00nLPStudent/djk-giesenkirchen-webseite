import AdminLayout from "@/components/admin/layout/AdminLayout";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  Newspaper,
  Shield,
  UserRound,
  Users,
  Plus,
  CheckCircle,
  Database,
  HardDrive,
  GitBranch,
  CalendarDays,
} from "lucide-react";

async function getCount(table) {
  const { count } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });

  return count || 0;
}

export default async function AdminPage() {
  const [newsCount, teamsCount, coachesCount, playersCount] = await Promise.all(
    [
      getCount("news"),
      getCount("teams"),
      getCount("coaches"),
      getCount("players"),
    ],
  );

  const { data: latestNews } = await supabase
    .from("news")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: plannedNews } = await supabase
    .from("news")
    .select("*")
    .eq("is_published", true)
    .gt("published_at", new Date().toISOString())
    .order("published_at", { ascending: true })
    .limit(5);

  const today = new Date();

  const greeting =
    today.getHours() < 12
      ? "Guten Morgen"
      : today.getHours() < 18
        ? "Guten Tag"
        : "Guten Abend";

  const systemStatus = [
    {
      label: "Supabase verbunden",
      value: "Aktiv",
      icon: Database,
    },
    {
      label: "Storage erreichbar",
      value: "Media Bucket",
      icon: HardDrive,
    },
    {
      label: "Letztes Backup",
      value: "GitHub",
      icon: GitBranch,
    },
    {
      label: "Version",
      value: "v0.1 CMS",
      icon: CheckCircle,
    },
  ];

  const stats = [
    {
      label: "News",
      value: newsCount,
      icon: Newspaper,
      href: "/admin/news",
    },
    {
      label: "Mannschaften",
      value: teamsCount,
      icon: Shield,
      href: "/admin/teams",
    },
    {
      label: "Trainer",
      value: coachesCount,
      icon: UserRound,
      href: "/admin/coaches",
    },
    {
      label: "Spieler",
      value: playersCount,
      icon: Users,
      href: "/admin/players",
    },
  ];

  return (
    <AdminLayout title="Dashboard" subtitle="Adminbereich">
      <section className="mb-10 rounded-3xl border border-white/10 bg-white/5 p-8">
        <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
          Willkommen zurück
        </p>

        <h2 className="mt-3 text-3xl font-black">{greeting} Swen 👋</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-3xl font-black">{plannedNews?.length || 0}</p>
            <p className="mt-1 text-sm text-white/50">geplante News</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-3xl font-black">1</p>
            <p className="mt-1 text-sm text-white/50">Training heute</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-3xl font-black">0</p>
            <p className="mt-1 text-sm text-white/50">Turniere am Wochenende</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-3xl font-black">0</p>
            <p className="mt-1 text-sm text-white/50">neue Medien</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-red-500/50 hover:bg-white/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600/20 text-red-400">
                  <Icon size={28} />
                </div>

                <p className="text-4xl font-black">{item.value}</p>
              </div>

              <h2 className="mt-6 text-xl font-black">{item.label}</h2>

              <p className="mt-2 text-sm text-white/50">Zum Bereich wechseln</p>
            </Link>
          );
        })}
      </div>

      <div className="mt-10 grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-black">Letzte News</h2>

          <div className="mt-6 space-y-4">
            {latestNews?.map((item) => (
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
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-black">Geplante News</h2>

          <div className="mt-6 space-y-4">
            {plannedNews?.length ? (
              plannedNews.map((item) => (
                <Link
                  key={item.id}
                  href={`/admin/news/edit/${item.id}`}
                  className="block rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-yellow-500/50"
                >
                  <p className="font-bold">{item.title_de}</p>
                  <p className="mt-1 text-sm text-yellow-400">
                    {new Date(item.published_at).toLocaleString("de-DE")}
                  </p>
                </Link>
              ))
            ) : (
              <p className="text-white/50">Aktuell sind keine News geplant.</p>
            )}
          </div>
        </section>
      </div>

      <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-2xl font-black">Schnellzugriffe</h2>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/admin/news/new"
            className="flex items-center gap-2 rounded-full bg-red-600 px-5 py-3 font-bold transition hover:bg-red-700"
          >
            <Plus size={18} />
            Neue News
          </Link>

          <Link
            href="/admin/teams/new"
            className="flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 font-bold text-white/70 transition hover:border-red-500 hover:text-white"
          >
            <Plus size={18} />
            Neue Mannschaft
          </Link>
        </div>
      </section>

      <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-2xl font-black">Systemstatus</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {systemStatus.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-black/20 p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20 text-green-400">
                    <Icon size={20} />
                  </div>

                  <div>
                    <p className="font-bold text-white">{item.label}</p>
                    <p className="text-sm text-white/50">{item.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </AdminLayout>
  );
}
