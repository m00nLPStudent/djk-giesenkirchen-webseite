import { Shield, UsersRound, UserRound, Handshake } from "lucide-react";
import StatisticGrid from "@/components/admin/ui/StatisticGrid";

export default function CoachStats({
  trainer = 0,
  coTrainer = 0,
  supervisors = 0,
  teams = 0,
  activeFilter = "alle",
  onFilterChange = () => {},
}) {
  const stats = [
    {
      title: "Trainer",
      value: trainer,
      filter: "trainer",
      icon: UserRound,
      color: "text-red-400",
      bg: "bg-red-500/20",
      description: "Alle Haupttrainer",
    },
    {
      title: "Co-Trainer",
      value: coTrainer,
      filter: "co-trainer",
      icon: UsersRound,
      color: "text-blue-400",
      bg: "bg-blue-500/20",
      description: "Alle Co-Trainer",
    },
    {
      title: "Betreuer",
      value: supervisors,
      filter: "betreuer",
      icon: Handshake,
      color: "text-green-400",
      bg: "bg-green-500/20",
      description: "Alle Betreuer",
    },
    {
      title: "Mannschaften",
      value: teams,
      filter: "mannschaften",
      icon: Shield,
      color: "text-yellow-400",
      bg: "bg-yellow-500/20",
      description: "Zugeordnete Teams",
    },
  ];

  return (
    <StatisticGrid
      items={stats}
      activeFilter={activeFilter}
      onFilterChange={onFilterChange}
    />
  );
}
