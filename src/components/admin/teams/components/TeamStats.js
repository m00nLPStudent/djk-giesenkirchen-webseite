import { CheckCircle2, Link2, PauseCircle, Shield } from "lucide-react";

function StatItem({ title, value, icon: Icon, boxClassName, textClassName }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${boxClassName}`}>
        <Icon className={textClassName} size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-white/45">
          {title}
        </p>
        <p className="mt-1 text-xl font-black text-white">{value}</p>
      </div>
    </div>
  );
}

export default function TeamStats({
  total = 0,
  active = 0,
  inactive = 0,
  footballDeReady = 0,
}) {
  const stats = [
    {
      title: "Mannschaften",
      value: total,
      icon: Shield,
      boxClassName: "bg-red-500/20",
      textClassName: "text-red-400",
    },
    {
      title: "Aktiv",
      value: active,
      icon: CheckCircle2,
      boxClassName: "bg-green-500/20",
      textClassName: "text-green-400",
    },
    {
      title: "Inaktiv",
      value: inactive,
      icon: PauseCircle,
      boxClassName: "bg-yellow-500/20",
      textClassName: "text-yellow-400",
    },
    {
      title: "fussball.de aktiv",
      value: footballDeReady,
      icon: Link2,
      boxClassName: "bg-blue-500/20",
      textClassName: "text-blue-400",
    },
  ];

  return (
    <div className="mb-8 overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04]">
      <div className="grid divide-y divide-white/10 md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
        {stats.map((item) => (
          <StatItem key={item.title} {...item} />
        ))}
      </div>
    </div>
  );
}
