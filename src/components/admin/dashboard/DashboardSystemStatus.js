import { Database, HardDrive, GitBranch, CheckCircle2 } from "lucide-react";

const statusItems = [
  {
    title: "Supabase",
    value: "Verbunden",
    icon: Database,
    color: "text-green-400",
    bg: "bg-green-500/20",
  },
  {
    title: "Storage",
    value: "Erreichbar",
    icon: HardDrive,
    color: "text-green-400",
    bg: "bg-green-500/20",
  },
  {
    title: "Backup",
    value: "GitHub",
    icon: GitBranch,
    color: "text-blue-400",
    bg: "bg-blue-500/20",
  },
  {
    title: "Version",
    value: "v0.1",
    icon: CheckCircle2,
    color: "text-red-400",
    bg: "bg-red-500/20",
  },
];

export default function DashboardSystemStatus() {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-2xl font-black">Systemstatus</h2>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {statusItems.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 p-4"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.bg}`}
              >
                <Icon className={item.color} size={24} />
              </div>

              <div>
                <p className="font-bold">{item.title}</p>
                <p className="text-sm text-white/50">{item.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
