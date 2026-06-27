import { AlertTriangle, Globe2, PauseCircle, Users } from "lucide-react";
import PlayerStatsCard from "../stats/PlayerStatsCard";

export default function PlayerStats({
  total = 0,
  inactive = 0,
  nationalityCount = 0,
  openContributions = 0,
}) {
  const stats = [
    {
      title: "Spieler insgesamt",
      value: total,
      href: "/admin/players",
      icon: Users,
      box: "bg-red-500/20",
      text: "text-red-400",
    },
    {
      title: "Inaktive Spieler",
      value: inactive,
      href: "/admin/players?status=inactive",
      icon: PauseCircle,
      box: "bg-yellow-500/20",
      text: "text-yellow-400",
    },
    {
      title: "Nationalitäten",
      value: nationalityCount,
      href: "/admin/players?view=nationalities",
      icon: Globe2,
      box: "bg-blue-500/20",
      text: "text-blue-400",
    },
    {
      title: "Offene Beiträge",
      value: openContributions,
      href: "/admin/players?contribution=open",
      icon: AlertTriangle,
      box: "bg-orange-500/20",
      text: "text-orange-400",
    },
  ];

  return (
    <div className="mb-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => (
        <PlayerStatsCard key={item.title} {...item} />
      ))}
    </div>
  );
}
