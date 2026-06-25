import Link from "next/link";
import { Newspaper, Shield, UserRound, Users } from "lucide-react";

const stats = [
  {
    label: "News",
    key: "news",
    icon: Newspaper,
    href: "/admin/news",
  },
  {
    label: "Mannschaften",
    key: "teams",
    icon: Shield,
    href: "/admin/teams",
  },
  {
    label: "Trainer",
    key: "coaches",
    icon: UserRound,
    href: "/admin/coaches",
  },
  {
    label: "Spieler",
    key: "players",
    icon: Users,
    href: "/admin/players",
  },
];

export default function DashboardStats({ counts }) {
  return (
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

              <p className="text-4xl font-black">{counts?.[item.key] || 0}</p>
            </div>

            <h2 className="mt-6 text-xl font-black">{item.label}</h2>

            <p className="mt-2 text-sm text-white/50">Zum Bereich wechseln</p>
          </Link>
        );
      })}
    </div>
  );
}
