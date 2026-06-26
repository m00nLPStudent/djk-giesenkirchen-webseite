import { Newspaper, Eye, Clock3, FileText } from "lucide-react";

export default function NewsStats({
  total = 0,
  published = 0,
  planned = 0,
  drafts = 0,
}) {
  const stats = [
    {
      title: "Alle News",
      value: total,
      icon: Newspaper,
      color: "text-red-400",
      bg: "bg-red-500/20",
    },
    {
      title: "Veröffentlicht",
      value: published,
      icon: Eye,
      color: "text-green-400",
      bg: "bg-green-500/20",
    },
    {
      title: "Geplant",
      value: planned,
      icon: Clock3,
      color: "text-yellow-400",
      bg: "bg-yellow-500/20",
    },
    {
      title: "Entwürfe",
      value: drafts,
      icon: FileText,
      color: "text-blue-400",
      bg: "bg-blue-500/20",
    },
  ];

  return (
    <div className="mb-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.title}
            className="rounded-3xl border border-white/10 bg-white/5 p-6"
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
          </div>
        );
      })}
    </div>
  );
}
