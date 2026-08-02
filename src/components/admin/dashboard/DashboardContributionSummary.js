import Link from "next/link";

export default function DashboardContributionSummary({ summary }) {
  return <section aria-labelledby="dashboard-contributions" className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
    <div className="flex items-center justify-between"><h2 id="dashboard-contributions" className="text-sm font-black">Vereinsbeiträge</h2><Link href="/admin/contributions" className="text-xs font-bold text-red-300">Öffnen</Link></div>
    <dl className="mt-3 divide-y divide-white/10 text-sm"><div className="flex justify-between py-2"><dt className="text-white/55">Offen</dt><dd className="font-black">{summary.openCount}</dd></div><div className="flex justify-between py-2"><dt className="text-white/55">Teilbezahlt</dt><dd className="font-black">{summary.partiallyPaidCount}</dd></div><div className="flex justify-between py-2"><dt className="text-white/55">Überfällig</dt><dd className="font-black text-red-300">{summary.overdueCount}</dd></div><div className="flex justify-between py-2"><dt className="text-white/55">Offener Betrag</dt><dd className="font-black">{summary.totalOutstanding} €</dd></div></dl>
  </section>;
}
