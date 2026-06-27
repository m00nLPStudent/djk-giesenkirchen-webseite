import Link from "next/link";

export default function PlayerStatsCard({ title, value, href, icon: Icon, box, text, disabled = false }) {
  const content = (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-red-500/50 hover:bg-white/10">
      <div className="flex items-center justify-between">
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${box}`}>
          <Icon className={text} size={28} />
        </div>

        <p className="text-4xl font-black">{value}</p>
      </div>

      <h2 className="mt-6 text-xl font-black">{title}</h2>
    </div>
  );

  if (disabled || !href) {
    return content;
  }

  return <Link href={href}>{content}</Link>;
}
