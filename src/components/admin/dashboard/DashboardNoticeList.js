import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

const tones = { danger: "bg-red-400", warning: "bg-amber-400", info: "bg-sky-400" };

export default function DashboardNoticeList({ notices = [] }) {
  return (
    <section aria-labelledby="dashboard-notices" className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
      <h2 id="dashboard-notices" className="sr-only">Hinweise und Aufgaben</h2>
      {notices.length ? notices.map((notice, index) => {
        const className = `flex min-h-11 items-center gap-3 px-4 py-2.5 text-sm transition ${index ? "border-t border-white/10" : ""}`;
        const content = <><span className={`h-2 w-2 shrink-0 rounded-full ${tones[notice.tone] || tones.info}`} /><strong className="text-white">{notice.count}</strong><span className="min-w-0 text-white/65">{notice.text}</span>{notice.href ? <span className="ml-auto text-xs font-bold text-red-300">Öffnen</span> : null}</>;
        return notice.href ? <Link key={notice.key} href={notice.href} className={`${className} hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-400`}>
          {content}
        </Link> : <div key={notice.key} className={className}>{content}</div>;
      }) : (
        <div className="flex min-h-11 items-center gap-3 px-4 py-3 text-sm text-white/60"><CheckCircle2 size={17} className="text-emerald-400" />Aktuell liegen keine dringenden Aufgaben vor.</div>
      )}
    </section>
  );
}
