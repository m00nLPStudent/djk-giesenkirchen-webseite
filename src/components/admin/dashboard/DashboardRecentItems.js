import Link from "next/link";

export default function DashboardRecentItems({ items }) {
  return <section aria-labelledby="dashboard-recent" className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><h2 id="dashboard-recent" className="text-sm font-black">Zuletzt relevant</h2><div className="mt-3 divide-y divide-white/10">{items.map((item) => <Link key={item.key} href={item.href} className="flex min-h-11 items-center gap-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"><span className="min-w-0 flex-1 truncate text-white/70">{item.title}</span><span className="text-xs text-white/35">{item.module}</span></Link>)}</div></section>;
}
