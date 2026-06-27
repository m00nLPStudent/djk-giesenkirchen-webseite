import { Users, Shield, Hash, PauseCircle } from "lucide-react";

export default function PlayerStats({ total = 0, active = 0, inactive = 0, goalkeepers = 0 }) {
  const stats = [
    { title: "Spieler gesamt", value: total, icon: Users, box: "bg-red-500/20", text: "text-red-400" },
    { title: "Aktive Spieler", value: active, icon: Shield, box: "bg-green-500/20", text: "text-green-400" },
    { title: "Torhüter", value: goalkeepers, icon: Hash, box: "bg-blue-500/20", text: "text-blue-400" },
    { title: "Pausiert", value: inactive, icon: PauseCircle, box: "bg-yellow-500/20", text: "text-yellow-400" },
  ];

  return (
    <div className="mb-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => {
        const Icon = item.icon;

        return (
          <div key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.box}`}>
                <Icon className={item.text} size={28} />
              </div>

              <p className="text-4xl font-black">{item.value}</p>
            </div>

            <h2 className="mt-6 text-xl font-black">{item.title}</h2>
          </div>
        );
      })}
    </div>
  );
}
