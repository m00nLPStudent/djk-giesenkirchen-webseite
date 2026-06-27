import { Shield, UsersRound, UserRound, Handshake } from "lucide-react";

function StatCard({ item, active, onClick }) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={() => onClick(item.filter)}
      className={`rounded-3xl border p-6 text-left transition ${
        active
          ? "border-red-500 bg-red-500/10"
          : "border-white/10 bg-white/5 hover:border-red-500/50 hover:bg-white/10"
      }`}
    >
      <div className="flex items-center justify-between">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.bg}`}
        >
          <Icon className={item.color} size={28} />
        </div>

        <p className="text-4xl font-black">{item.value}</p>
      </div>

      <h2 className="mt-6 text-xl font-black">{item.title}</h2>
      <p className="mt-2 text-sm text-white/45">{item.description}</p>
    </button>
  );
}

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
    <div className="mb-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => (
        <StatCard
          key={item.title}
          item={item}
          active={activeFilter === item.filter}
          onClick={onFilterChange}
        />
      ))}
    </div>
  );
}
